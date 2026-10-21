// @ts-nocheck
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const ordermodel = require('../models/order.model');
const User = require('../models/user.model');
const GeneralSettingModel = require('../models/generalSetting.model');
const moment = require('moment');
const { getEffectivePlanLimits, syncUserMonthlyUsage } = require('./plan.service');

const getOrderList = async (filter = {}, options = {}, userId) => {
  try {
    // Validate and extract pagination values
    const page =
      parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
    const limit =
      parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
    const skip = (page - 1) * limit;
    let sort = { purchaseDate: -1 };
    // Base query filter
    let searchData = [
      { status: { $ne: 2 } },
      { userId: new mongoose.Types.ObjectId(userId) },
    ];

    // Search logic
    if (filter.search) {
      const escaped = String(filter.search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchValue = { $regex: escaped, $options: 'i' };
      searchData.push({
        $or: [
          { amazonOrderId: searchValue },
          { buyerEmail: searchValue },
          { 'orderItems.sellerSKU': searchValue },
          { 'orderItems.ASIN': searchValue },
          { 'orderItems.title': searchValue },
          { 'orderItems.orderItemId': searchValue },
          { 'shippingAddress.city': searchValue },
          { 'shippingAddress.postalCode': searchValue },
        ],
      });
    }
    if (
      options.sortBy &&
      options.sortBy !== 'undefined' &&
      options.sortOrder !== 'undefined'
    ) {
      const sortField = options.sortBy.includes(':')
        ? options.sortBy.split(':')[0]
        : options.sortBy;
      const sortDirection =
        options.sortOrder ||
        (options.sortBy.includes(':') ? options.sortBy.split(':')[1] : 'desc');
      sort = { [sortField]: sortDirection === 'asc' ? 1 : -1 };
    }
    //date logic
    if (filter.from && filter.to) {
      const { from, to } = filter;

      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);

        searchData.push({
          $or: [
            {
              purchaseDate: {
                $gte: fromDate,
                $lte: toDate,
              },
            },
            {
              earliestDeliveryDate: {
                $gte: fromDate,
                $lte: toDate,
              },
            },
          ],
        });
      }
    }

    if (filter.marketplaceId) {
      searchData.push({
        marketplaceId: Array.isArray(filter.marketplaceId)
          ? { $in: filter.marketplaceId }
          : { $in: filter.marketplaceId.split(',')?.map((id) => id.trim()) },
      });
    }

    const matchStage = { $match: { $and: searchData } };

    // Count total documents
    const countPromise = ordermodel
      .aggregate([matchStage, { $count: 'count' }])
      .exec();

    // Build projectStage after it's defined
    const projectStage = {
      $project: {
        comment: 1,
        orderTotal: 1,
        shippingAddress: 1,
        amazonOrderId: 1,
        buyerEmail: 1,
        earliestDeliveryDate: 1,
        orderStatus: 1,
        fulfillmentChannel: 1,
        shipServiceLevel: 1,
        marketplaceId: 1,
        purchaseDate: 1,
        orderItems: 1,
        salesChannel: 1,
        shipmentServiceLevelCategory: 1,
        isSent: 1,
        status: 1,
        isNeedToSend: 1,
        daysDifference: {
          $let: {
            vars: {
              purchase: '$purchaseDate',
              delivery: '$earliestDeliveryDate',
            },
            in: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ['$$purchase', null] },
                    { $ne: ['$$delivery', null] },
                  ],
                },
                then: {
                  $ceil: {
                    $divide: [
                      { $subtract: ['$$delivery', '$$purchase'] },
                      1000 * 60 * 60 * 24,
                    ],
                  },
                },
                else: null,
              },
            },
          },
        },
      },
    };

    const docsPromise = ordermodel.aggregate([
      matchStage,
      projectStage,
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Wait for both queries
    const [countResult, data] = await Promise.all([countPromise, docsPromise]);

    const totalResults = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalResults / limit);

    // Attach accurate plan quota and used limits for this seller (current month)
    let planLimits = null;
    try {
      const user = await User.findById(userId);
      if (user) {
        planLimits = await getEffectivePlanLimits(user);
      }
    } catch (err) {
      console.error('Error attaching planLimits in getOrderList:', err.message);
    }

    return {
      pagination: {
        length: totalResults,
        size: limit,
        page,
        lastPage: totalPages,
      },
      planLimits,
      data,
      status: httpStatus.OK,
    };
  } catch (error) {
    console.error('Error in getOrderList:', error.message);
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'Failed to fetch order list.',
      error: error.message,
    };
  }
};

const updateFeedback = async (refIds, userId) => {
  try {
    if (!refIds || refIds.length === 0) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: 'Ref IDs are required.',
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'User not found',
      };
    }

    // Plan limit & expiration / cancellation check
    const planLimits = await getEffectivePlanLimits(user);
    if (planLimits?.isCanceled || user.subscriptionStatus === 3) {
      return {
        status: httpStatus.FORBIDDEN,
        message:
          'Your subscription plan has been cancelled. Please subscribe to an active plan to send review requests.',
      };
    }
    if (planLimits?.isExpired) {
      return {
        status: httpStatus.FORBIDDEN,
        message:
          'Your subscription plan has expired. Please renew your subscription plan to send review requests.',
      };
    }

    // Retrieve active marketplaces
    const setting = await GeneralSettingModel.findOne({
      userId,
      status: { $ne: 2 },
    }).lean();

    const activeMarketplaces = setting?.activeMarketplaces || [];
    if (activeMarketplaces.length === 0) {
      return {
        status: httpStatus.BAD_REQUEST,
        message:
          'You have no active marketplaces configured. Please configure and activate at least one marketplace first.',
      };
    }

    // Fetch the target orders to validate marketplaces and ownership
    const parsedRefIds = refIds.map((id) => new mongoose.Types.ObjectId(id));
    const targetOrders = await ordermodel
      .find({
        _id: { $in: parsedRefIds },
        userId,
      })
      .lean();

    if (!targetOrders || targetOrders.length === 0) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'No matching orders found.',
      };
    }

    // Filter orders by active marketplaces
    const allowedOrders = targetOrders.filter((order) =>
      activeMarketplaces.includes(order.marketplaceId)
    );

    if (allowedOrders.length === 0) {
      return {
        status: httpStatus.BAD_REQUEST,
        message:
          'None of the selected orders belong to your active marketplaces for this month.',
      };
    }

    const maxReviewRequestsPerMonth =
      planLimits?.maxReviewRequestsPerMonth ?? 1000;

    // Check currently used review requests for the current month
    const effectiveUsed =
      planLimits?.usedReviewRequests !== undefined
        ? Number(planLimits.usedReviewRequests)
        : await syncUserMonthlyUsage(user);

    const remaining = maxReviewRequestsPerMonth - effectiveUsed;
    if (remaining <= 0) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: `Plan limit reached! You have already used all ${maxReviewRequestsPerMonth} review requests for your plan (${effectiveUsed}/${maxReviewRequestsPerMonth} used). Please upgrade your plan to send more requests.`,
      };
    }

    // Only count orders that have NOT yet been scheduled or sent
    const newOrdersToQueue = allowedOrders.filter(
      (order) => !order.isSent && !order.isNeedToSend
    );

    if (newOrdersToQueue.length === 0) {
      return {
        status: httpStatus.BAD_REQUEST,
        message:
          'The selected order request has already been sent or is currently pending.',
      };
    }

    if (newOrdersToQueue.length > remaining) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: `Cannot send ${newOrdersToQueue.length} requests. You only have ${remaining} remaining requests left in your monthly plan quota (${effectiveUsed}/${maxReviewRequestsPerMonth} used).`,
      };
    }

    const allowedIds = newOrdersToQueue.map((o) => o._id);

    // Update orders to isNeedToSend: true
    const data = await ordermodel.updateMany({ _id: { $in: allowedIds } }, [
      {
        $set: {
          isNeedToSend: {
            $cond: [{ $eq: ['$isSent', false] }, true, '$isNeedToSend'],
          },
        },
      },
    ]);

    // Recalculate and synchronize seller's usedReviewRequests count in user model (current month)
    const newTotalUsed = await syncUserMonthlyUsage(user);

    let warningMessage = '';
    if (allowedOrders.length < parsedRefIds.length) {
      warningMessage = ` (${
        parsedRefIds.length - allowedOrders.length
      } orders were skipped because they belong to inactive marketplaces).`;
    }

    return {
      data,
      usedReviewRequests: newTotalUsed,
      maxReviewRequestsPerMonth,
      remainingReviewRequests: Math.max(
        0,
        maxReviewRequestsPerMonth - newTotalUsed
      ),
      message: `Successfully scheduled review request${
        allowedIds.length > 1 ? 's' : ''
      }${warningMessage}.`,
      status: 200,
    };
  } catch (error) {
    console.error('Error in updateFeedback:', error.message);
    return {
      message: error.message,
      status: 500,
    };
  }
};
module.exports = {
  getOrderList,
  updateFeedback,
};
