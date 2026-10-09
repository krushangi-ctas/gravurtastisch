// @ts-nocheck
const axios = require('axios');
const moment = require('moment');
const ordermodel = require('./models/order.model');
const AmazonCredentialsModel = require('./models/amazon-credentials.model');
const UserModel = require('./models/user.model');
const GeneralSettingModel = require('./models/generalSetting.model');

const CronErrorModel = require('./models/cron-error.model');

// Module-level token cache (per userId)
const tokenCache = new Map();

// Get Amazon access token (refresh_token flow)
async function getAmazonAccessToken(creds) {
  try {
    const response = await axios.post(
      creds.amz_auth_url || 'https://api.amazon.com/auth/o2/token',
      {
        grant_type: 'refresh_token',
        refresh_token: creds.refresh_token,
        client_id: creds.client_id,
        client_secret: creds.client_secret,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const token = response.data?.access_token ?? null;
    if (token) {
      tokenCache.set(creds.userId, token); // Store in cache per user
    }
    return token;
  } catch (err) {
    await CronErrorModel.create({
      fn: 'getAmazonAccessToken',
      action_type: 'getAmazonAccessToken',
      error_data: err?.response?.data || err?.message || err,
      userId: creds.userId,
    }).catch((error) => {
      console.error(`Failed to log error for user ${creds.userId}:`, error);
    });
    console.error(
      `Error fetching Amazon token for user ${creds.userId}:`,
      err?.response?.data || err.message
    );
    return null;
  }
}

// Get token from cache or login if not present
async function getToken(creds) {
  const cachedToken = tokenCache.get(creds.userId);
  if (cachedToken) {
    return cachedToken;
  }
  const token = await getAmazonAccessToken(creds);
  if (!token) {
    return null;
  }
  return token;
}

// Call SP-API: createProductReviewAndSellerFeedbackSolicitation
async function createSolicitation(
  amazonOrderId,
  accessToken,
  marketplaceId,
  baseUrl
) {
  try {
    const url = `${baseUrl}/solicitations/v1/orders/${amazonOrderId}/solicitations/productReviewAndSellerFeedback?marketplaceIds=${marketplaceId}`;
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    return response.data;
  } catch (err) {
    await CronErrorModel.create({
      action_type: 'createSolicitation',
      error_data: err?.response?.data || err?.message || err,
    }).catch((error) => {
      console.error('Failed to log error ', error);
    });
    // Amazon returns 403 if already solicited, treat as success
    if (err.response && err.response.status === 403) {
      console.warn(
        `Order ${amazonOrderId}: Already solicited or not eligible.`
      );
      return { alreadySolicited: true };
    }
    // If authentication error, mark for retry
    if (
      err.response &&
      (err.response.status === 401 || err.response.status === 403)
    ) {
      err.isAuthError = true;
      // tokenCache.delete(creds.userId); // Clear cache for user
    }
    throw err;
  }
}

// Batch utility: Promise.all in batches of N with delay between batches
async function processInBatches(items, batchSize, delayMs, processFn) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processFn));
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// Main function to run the solicitation process
async function runSolicitationProcess() {
  try {
    // 1. Fetch all seller credentials
    const credentials = await AmazonCredentialsModel.find();
    if (!credentials.length) {
      console.log('No seller credentials found');
      return;
    }

    // 2. Process each seller's orders
    for (const creds of credentials) {
      const {
        userId,
        marketplace_id: marketplaceIds,
        amz_sp_api_base_url = 'https://sellingpartnerapi-eu.amazon.com',
      } = creds;

      // Plan limit check: Monthly Review Requests Limit
      const user = await UserModel.findById(userId);
      if (!user) {
        console.log(`User ${userId} not found, skipping solicitation`);
        continue;
      }

      // Retrieve general settings to find active marketplaces
      const setting = await GeneralSettingModel.findOne({
        userId,
        status: 1,
      }).lean();

      const activeMarketplaces = setting?.activeMarketplaces || [];
      if (activeMarketplaces.length === 0) {
        console.log(
          `User ${userId} has no active marketplaces in settings. Skipping solicitation.`
        );
        continue;
      }

      const maxReviewRequestsPerMonth =
        user.planLimits?.maxReviewRequestsPerMonth ?? 1000;
      const startOfMonth = moment().startOf('month').toDate();
      const sentCount = await ordermodel.countDocuments({
        userId,
        isSent: true,
        updatedAt: { $gte: startOfMonth },
      });

      const remaining = maxReviewRequestsPerMonth - sentCount;
      if (remaining <= 0) {
        console.log(
          `User ${userId} has reached their monthly review requests limit (${maxReviewRequestsPerMonth}). Skipping solicitation.`
        );
        continue;
      }

      // 3. Find orders for this seller where isNeedToSend: true
      let orders = await ordermodel
        .find(
          {
            userId,
            isNeedToSend: true,
            // earliestDeliveryDate: { $lt: new Date() },
            status: { $ne: 2 },
            marketplaceId: { $in: activeMarketplaces },
          },
          'amazonOrderId marketplaceId userId'
        )
        .lean();

      if (!orders.length) {
        console.log(`No eligible orders found for user ${userId}`);
        continue;
      }

      // Cap the orders array to remaining limit
      if (orders.length > remaining) {
        console.log(
          `User ${userId} has ${orders.length} orders but only ${remaining} remaining review requests. Capping this batch.`
        );
        orders = orders.slice(0, remaining);
      }

      // 4. Get token for this seller
      const token = await getToken(creds);

      if (!token) {
        console.error(
          `Failed to get Amazon access token for user ${userId}. Skipping.`
        );
        continue;
      }

      // 5. Pre-check eligibility via GET /solicitations API
      const validOrders = [];
      const bulkOps = [];

      await processInBatches(orders, 1, 1000, async (order) => {
        try {
          const url = `${amz_sp_api_base_url}/solicitations/v1/orders/${order.amazonOrderId}?marketplaceIds=${order.marketplaceId}`;
          const resp = await axios.get(url, {
            headers: {
              'x-amz-access-token': token,
              Accept: 'application/hal+json',
            },
          });

          const actions = resp?.data?._links?.actions || [];
          const canSolicit = actions.some(
            (a) => a.name === 'productReviewAndSellerFeedback'
          );

          if (canSolicit) {
            validOrders.push(order);
          } else {
            console.log(
              `Order ${order.amazonOrderId} not eligible for solicitation`
            );
            bulkOps.push({
              updateOne: {
                filter: { amazonOrderId: order.amazonOrderId, userId },
                update: { $set: { comment: 'Not eligible for solicitation' } },
              },
            });
          }
        } catch (err) {
          await CronErrorModel.create({
            action_type: 'Eligibility',
            error_data: err?.response?.data || err?.message || err,
            userId: creds.userId,
          }).catch((error) => {
            console.error(
              `Failed to log error for user ${creds.userId}:`,
              error
            );
          });
          console.error(
            `Eligibility check failed for order ${order.amazonOrderId}:`,
            err?.response?.data || err.message
          );
        }
      });
      if (bulkOps.length > 0) {
        try {
          // const result = await ordermodel.bulkWrite(bulkOps, {
          //   ordered: false,
          // });
        } catch (bulkErr) {
          console.error('Bulk write error:', bulkErr);
        }
      }
      if (!validOrders.length) {
        // console.log(`No valid orders to solicit for user ${userId}`);
        continue;
      }
      //6. Process orders in batches of 1, with 1s delay between batches
      await processInBatches(validOrders, 1, 2000, async (order) => {
        let success = false;
        while (!success) {
          let tokenToUse = await getToken(creds);
          if (!tokenToUse) {
            console.error(
              `Failed to get Amazon access token for order ${order.amazonOrderId} (user ${userId}). Skipping.`
            );
            break;
          }
          try {
            await createSolicitation(
              order.amazonOrderId,
              tokenToUse,
              order.marketplaceId,
              amz_sp_api_base_url
            ).catch(async (err) => {
              await CronErrorModel.create({
                action_type: 'isAuthError',
                error_data: err?.response?.data || err?.message || err,
                userId: creds.userId,
              }).catch((error) => {
                console.error(
                  `Failed to log error for user ${creds.userId}:`,
                  error
                );
              });
              if (err.isAuthError) {
                tokenToUse = await getToken(creds);
                await createSolicitation(
                  order.amazonOrderId,
                  tokenToUse,
                  order.marketplaceId,
                  amz_sp_api_base_url
                );
              } else {
                throw err;
              }
            });
            // Update order after successful request
            await ordermodel.updateOne(
              { amazonOrderId: order.amazonOrderId, userId },
              { $set: { isNeedToSend: false, isSent: true } }
            );
            success = true;
          } catch (err) {
            await CronErrorModel.create({
              action_type: 'Solicitation failed',
              error_data: err?.response?.data || err?.message || err,
              userId: creds.userId,
              errorLog: `Solicitation failed for order ${order.amazonOrderId} (user ${userId}):`,
            }).catch((error) => {
              console.error(
                `Failed to log error for user ${creds.userId}:`,
                error
              );
            });
            console.error(
              `Solicitation failed for order ${order.amazonOrderId} (user ${userId}):`,
              err?.response?.data || err.message
            );
            break;
          }
        }
      });
    }
  } catch (err) {
    await CronErrorModel.create({
      action_type: 'runSolicitationProcess failed',
      error_data: err?.response?.data || err?.message || err,
    }).catch((error) => {
      console.error('Failed to log error for user:', error);
    });
    console.error('Error in runSolicitationProcess:', err);
  }
}

module.exports = { runSolicitationProcess };
