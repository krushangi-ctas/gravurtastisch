// @ts-nocheck
const moment = require('moment');
const GeneralSettingModel = require('./models/generalSetting.model');
const ordermodel = require('./models/order.model');
const UserModel = require('./models/user.model');

// Main function to run the solicitation process
async function autoFeedbackRequest() {
  try {
    // 1. Get all active general settings
    const settings = await GeneralSettingModel.find({
      status: 1,
      autoSendRequest: true,
    }).lean();

    if (!settings || settings.length === 0) {
      console.log('No active auto feedback settings found');
      return;
    }
    const now = moment();

    for (const setting of settings) {
      if (!setting.userId) {
        continue;
      }

      const user = await UserModel.findById(setting.userId);
      if (!user) {
        console.log(
          `User ${setting.userId} not found. Skipping auto-feedback scheduling.`
        );
        continue;
      }

      // Check remaining quota limits
      const maxReviewRequestsPerMonth =
        user.planLimits?.maxReviewRequestsPerMonth ?? 1000;
      const startOfMonth = moment().startOf('month').toDate();
      const sentCount = await ordermodel.countDocuments({
        userId: setting.userId,
        isSent: true,
        updatedAt: { $gte: startOfMonth },
      });

      const queuedCount = await ordermodel.countDocuments({
        userId: setting.userId,
        isNeedToSend: true,
        isSent: false,
      });

      const remaining = maxReviewRequestsPerMonth - (sentCount + queuedCount);
      if (remaining <= 0) {
        console.log(
          `User ${setting.userId} has reached or exceeded their monthly quota (${sentCount}/${maxReviewRequestsPerMonth} sent, ${queuedCount} queued). Skipping scheduling.`
        );
        continue;
      }

      // Step 1: Subtract settings values from current date/time
      let adjustedTime = now
        .clone()
        .subtract(setting.day || 0, 'days')
        .subtract(Number(setting.hour || 0), 'hours')
        .subtract(Number(setting.minute || 0), 'minutes')
        .subtract(Number(setting.second || 0), 'seconds');

      // Step 2: Subtract extra 30 minutes
      adjustedTime = adjustedTime.subtract(30, 'minutes');

      const filter = {
        userId: setting.userId,
        isSent: false,
        createdAt: { $gte: adjustedTime.toDate() },
        $or: [
          { isNeedToSend: false },
          { isNeedToSend: { $exists: false } },
          { isNeedToSend: null },
        ],
      };

      if (
        Array.isArray(setting.activeMarketplaces) &&
        setting.activeMarketplaces.length > 0
      ) {
        filter.marketplaceId = { $in: setting.activeMarketplaces };
      } else {
        console.log(
          `User ${setting.userId} has no active marketplaces in settings. Skipping auto-feedback scheduling.`
        );
        continue;
      }

      // Fetch eligible orders and limit to the remaining quota
      const eligibleOrders = await ordermodel
        .find(filter)
        .limit(remaining)
        .select('_id')
        .lean();

      if (eligibleOrders.length > 0) {
        const eligibleIds = eligibleOrders.map((o) => o._id);
        const res = await ordermodel.updateMany(
          { _id: { $in: eligibleIds } },
          { $set: { isNeedToSend: true } }
        );
        console.log(
          `Auto feedback scheduled ${
            res.nModified || res.modifiedCount || 0
          } orders for user ${
            setting.userId
          } (${setting.activeMarketplaces.join(', ')})`
        );
      } else {
        console.log(
          `No new eligible orders found to schedule for user ${setting.userId}`
        );
      }
    }
  } catch (err) {
    console.error('Error in autoFeedbackRequest:', err.message);
  }
}

module.exports = { autoFeedbackRequest };
