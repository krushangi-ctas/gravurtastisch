// @ts-nocheck
const axios = require('axios');
const AmazonCredentialsModel = require('./models/amazon-credentials.model');
const ordermodel = require('./models/order.model');
const GeneralSettingModel = require('./models/generalSetting.model');
let PAST_HOURS = 1;
let isScriptRunning = false;

/**
 * Check if the response indicates an unauthorized error
 * @param {Object} response
 * @returns {boolean}
 */
const checkIfUnauthorized = (response) =>
  response?.status === 403 &&
  response?.data?.errors?.[0]?.code === 'Unauthorized';

/***************************AMZ**************************************/
/**
 * Fetch a new access token using refresh_token flow
 * @param {Object} creds - Seller credentials
 * @returns {Promise<string | null>}
 */
const accessToken = async (creds) => {
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
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data?.access_token ?? null;
  } catch (err) {
    console.error(
      `Error fetching Amazon token for user ${creds.userId}:`,
      err?.response?.data || err.message
    );
    return null;
  }
};

/**
 * Fetch orders from Amazon SP-API for a specific marketplace
 * @param {string} token - Access token
 * @param {string} marketplaceId - Marketplace ID
 * @param {string} baseUrl - SP-API base URL
 * @returns {Promise<any[]>}
 */
const fetchOrders = async (token, marketplaceId, baseUrl) => {
  const getOrders = async () => {
    let currentDate = new Date();
    let previousDate = new Date(currentDate);
    console.log('previousDate: ', previousDate);
    previousDate.setHours(previousDate.getHours() - PAST_HOURS);
    // previousDate.setHours(previousDate.getHours() - 1);
    previousDate = previousDate.toISOString();
    console.log(currentDate, 'previousDate: ', previousDate);

    return await axios.get(`${baseUrl}/orders/v0/orders`, {
      params: {
        MarketplaceIds: marketplaceId,
        LastUpdatedAfter: previousDate,
        OrderStatuses: 'Shipped',
      },
      headers: {
        'x-amz-access-token': token,
      },
    });
  };

  try {
    if (!token || token.trim().length === 0) {
      return [];
    }

    let response = await getOrders();

    if (checkIfUnauthorized(response)) {
      return [];
    }

    const orders = response?.data?.payload?.Orders || [];
    return orders;
  } catch (err) {
    console.error('Fetch order error:', err.response?.data || err.message);
    return [];
  }
};

/**
 * Fetch order items from Amazon SP-API
 * @param {string} token - Access token
 * @param {string} orderId - Amazon order ID
 * @param {string} baseUrl - SP-API base URL
 * @returns {Promise<any[]>}
 */
const fetchOrderItems = async (token, orderId, baseUrl) => {
  try {
    const url = `${baseUrl}/orders/v0/orders/${orderId}/orderItems`;
    const response = await axios.get(url, {
      headers: {
        'x-amz-access-token': token,
      },
    });
    return response.data?.payload?.OrderItems ?? [];
  } catch (err) {
    console.error(`Failed to fetch order items for ${orderId}:`, err.message);
    return [];
  }
};

/**
 * Calculate totals for order items
 * @param {any[]} filteredItems
 * @returns {Object}
 */
const calculateOrderItemTotals = (filteredItems) => {
  let totalAmount = 0;
  let promotionalTotal = 0;
  if (!Array.isArray(filteredItems) || filteredItems.length === 0) {
    return { totalAmount: 0, promotionalTotal: 0 };
  }
  for (const item of filteredItems) {
    const itemPrice = parseFloat(item?.ItemPrice?.Amount ?? 0);
    const itemTax = parseFloat(item?.ItemTax?.Amount ?? 0);
    const promoDiscount = parseFloat(item?.PromotionDiscount?.Amount ?? 0);
    const promoTax = parseFloat(item?.PromotionDiscountTax?.Amount ?? 0);
    totalAmount += itemPrice + itemTax;
    promotionalTotal += promoDiscount + promoTax;
  }
  return {
    totalAmount: totalAmount.toFixed(2),
    promotionalTotal: promotionalTotal.toFixed(2),
  };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Manage orders for all sellers and their marketplaces
 * @param {number} [] - Optional hours to look back
 */
const manageOrders = async () => {
  if (isScriptRunning) {
    return;
  }
  isScriptRunning = true;
  // if (hours) {
  //   PAST_HOURS = hours;
  //   console.log('PAST_HOURS: ', PAST_HOURS);
  // }

  try {
    // Fetch all seller credentials
    const credentials = await AmazonCredentialsModel.find();
    if (!credentials.length) {
      console.log('No seller credentials found');
      return;
    }

    // Process each seller's orders
    for (const creds of credentials) {
      const {
        userId,
        marketplace_id: marketplaceIds,
        amz_sp_api_base_url = 'https://sellingpartnerapi-eu.amazon.com',
      } = creds;

      const setting = await GeneralSettingModel.findOne({
        userId,
        status: 1,
      }).lean();

      const activeMarketplaces = setting?.activeMarketplaces || [];
      const marketplacesToProcess = marketplaceIds.filter((id) =>
        activeMarketplaces.includes(id)
      );

      if (marketplacesToProcess.length === 0) {
        console.log(
          `User ${userId} has no active marketplaces in settings. Skipping order sync.`
        );
        continue;
      }

      const token = await accessToken(creds);

      if (!token) {
        console.log(`Skipping user ${userId}: No valid token`);
        continue;
      }

      // Process each marketplace ID for the seller
      for (const marketplaceId of marketplacesToProcess) {
        let bulkOps = [];
        const orders = await fetchOrders(
          token,
          marketplaceId,
          amz_sp_api_base_url
        );
        if (!Array.isArray(orders) || orders.length === 0) {
          console.log(
            `No orders found for user ${userId} in marketplace ${marketplaceId}`
          );
          continue;
        }

        for (const order of orders) {
          const orderId = order?.AmazonOrderId;
          console.log('orderId: ', orderId);
          if (!orderId) continue;

          const orderItems = await fetchOrderItems(
            token,
            orderId,
            amz_sp_api_base_url
          );

          const filteredItems = orderItems.filter(
            (items) => (items?.QuantityShipped ?? 0) > 0
          );
          const { totalAmount, promotionalTotal } =
            calculateOrderItemTotals(filteredItems);

          const transformedOrder = {
            updateOne: {
              filter: { amazonOrderId: orderId, userId },
              update: {
                $set: {
                  userId, // Add userId to track seller
                  isSent: false,
                  amazonOrderId: orderId,
                  buyerEmail: order?.BuyerInfo?.BuyerEmail ?? '',
                  orderStatus: 'Shipped',
                  processedBy: 'CRON',
                  latestDeliveryDate: order?.LatestDeliveryDate ?? '',
                  fulfillmentChannel: order?.FulfillmentChannel ?? '',
                  shipServiceLevel: order?.ShipServiceLevel ?? '',
                  marketplaceId: order?.MarketplaceId ?? '',
                  purchaseDate: order?.PurchaseDate
                    ? new Date(order.PurchaseDate)
                    : null,
                  isBusinessOrder: order?.IsBusinessOrder ?? false,
                  salesChannel: order?.SalesChannel ?? '',
                  shippingAddress: {
                    postalCode: order?.ShippingAddress?.PostalCode ?? '',
                    city: order?.ShippingAddress?.City ?? '',
                    countryCode: order?.ShippingAddress?.CountryCode ?? '',
                    addressLine1: order?.ShippingAddress?.AddressLine1 ?? '',
                    addressLine2: order?.ShippingAddress?.AddressLine2 ?? '',
                  },
                  orderTotal: {
                    currencyCode: order?.OrderTotal?.CurrencyCode ?? '',
                    amount: order?.OrderTotal?.Amount ?? 0,
                  },
                  earliestDeliveryDate: order?.EarliestDeliveryDate
                    ? new Date(order.EarliestDeliveryDate)
                    : null,
                  shipmentServiceLevelCategory:
                    order?.ShipmentServiceLevelCategory ?? '',
                  orderItems: filteredItems.map((items) => ({
                    orderItemId: items.OrderItemId,
                    ASIN: items.ASIN,
                    sellerSku: items.SellerSku,
                    title: items.Title,
                    quantityShipped: items.QuantityShipped,
                    isGift: items.IsGift,
                    itemPrice: items.ItemPrice,
                    conditionSubtypeId: items.ConditionSubtypeId,
                    isTransparency: items.IsTransparency,
                    quantityOrdered: items.QuantityOrdered,
                    promotionDiscountTax: items.PromotionDiscountTax,
                    promotionDiscount: items.PromotionDiscount,
                    conditionId: items.ConditionId,
                    productInfo: items.ProductInfo,
                  })),
                  totalAmount,
                  promotionalTotal,
                },
              },
              upsert: true,
            },
          };
          bulkOps.push(transformedOrder);
          await sleep(1000);
        }
        // Chunked bulkWrite if bulkOps > 10
        if (bulkOps.length > 0) {
          const chunkSize = 10;
          for (let i = 0; i < bulkOps.length; i += chunkSize) {
            const chunk = bulkOps.slice(i, i + chunkSize);
            try {
              await ordermodel.bulkWrite(chunk, {
                skipValidation: false,
              });
            } catch (err) {
              console.error(
                `Bulk write error for user ${userId}, marketplace ${marketplaceId}:`,
                err
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in manageOrders:', err);
  } finally {
    // PAST_HOURS = 1;
    isScriptRunning = false;
  }
};

module.exports = {
  manageOrders,
};
