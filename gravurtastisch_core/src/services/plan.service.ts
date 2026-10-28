// @ts-nocheck
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const moment = require('moment');
const PlanModel = require('../models/plan.model');
const ordermodel = require('../models/order.model');
const User = require('../models/user.model');
const { sendPlanExpiryReminderEmail } = require('./email.service');
const errorHandler = require('../utils/error.handler');
const { systemLog } = require('../utils/system-log');

const createPlan = async (bodyData, userId) => {
  try {
    const payload = {
      name: bodyData.name,
      price: Number(bodyData.price),
      currency: bodyData.currency || 'eur',
      marketplace: Number(bodyData.marketplace ?? bodyData.marketplce ?? 0),
      request_quota: Number(bodyData.request_quota ?? 0),
      expireAt: bodyData.expireAt ? new Date(bodyData.expireAt) : null,
      billingCycle: bodyData.billingCycle !== undefined ? Number(bodyData.billingCycle) : 1,
      status: bodyData.status !== undefined ? Number(bodyData.status) : 1,
      createdBy: userId || null,
    };

    const plan = await PlanModel.create(payload);

    await systemLog(
      'CREATE',
      plan.toObject ? plan.toObject() : plan,
      userId,
      'create-plan'
    );

    return {
      status: httpStatus.CREATED,
      message: 'Plan created successfully.',
      data: plan,
    };
  } catch (error) {
    errorHandler.errorM({ action_type: 'create-plan', error_data: error });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error creating plan',
    };
  }
};

const updatePlan = async (planId, updateData, userId) => {
  try {
    const existingPlan = await PlanModel.findById(planId);
    if (!existingPlan || existingPlan.status === 2) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Plan not found.',
      };
    }

    const existingData = existingPlan.toObject
      ? existingPlan.toObject()
      : JSON.parse(JSON.stringify(existingPlan));

    const payload = {
      ...updateData,
      updatedBy: userId || null,
    };

    if (updateData.marketplce !== undefined && updateData.marketplace === undefined) {
      payload.marketplace = Number(updateData.marketplce);
      delete payload.marketplce;
    }
    if (updateData.price !== undefined) {
      payload.price = Number(updateData.price);
    }
    if (updateData.marketplace !== undefined) {
      payload.marketplace = Number(updateData.marketplace);
    }
    if (updateData.request_quota !== undefined) {
      payload.request_quota = Number(updateData.request_quota);
    }
    if (updateData.expireAt !== undefined) {
      payload.expireAt = updateData.expireAt ? new Date(updateData.expireAt) : null;
    }
    if (updateData.billingCycle !== undefined) {
      payload.billingCycle = Number(updateData.billingCycle);
    }

    const updatedPlan = await PlanModel.findByIdAndUpdate(
      planId,
      { $set: payload },
      { new: true }
    );

    await systemLog(
      'UPDATE',
      updatedPlan.toObject ? updatedPlan.toObject() : updatedPlan,
      userId,
      'update-plan',
      existingData
    );

    return {
      status: httpStatus.OK,
      message: 'Plan updated successfully.',
      data: updatedPlan,
    };
  } catch (error) {
    errorHandler.errorM({ action_type: 'update-plan', error_data: error });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error updating plan',
    };
  }
};

const getPlans = async (filter = {}, options = {}) => {
  try {
    const query = {};

    if (
      filter.status !== undefined &&
      filter.status !== null &&
      filter.status !== ''
    ) {
      query.status = Number(filter.status);
    } else {
      // Default: exclude soft-deleted plans (status = 2)
      query.status = { $ne: 2 };
    }

    if (filter.search) {
      const searchTrimmed = filter.search.trim();
      const searchRegex = { $regex: searchTrimmed, $options: 'i' };
      const orConditions = [{ name: searchRegex }];

      const numericVal = Number(searchTrimmed);
      if (!isNaN(numericVal)) {
        orConditions.push(
          { price: numericVal },
          { marketplace: numericVal },
          { request_quota: numericVal }
        );
      }
      query.$or = orConditions;
    }

    const limit =
      options.limit && parseInt(options.limit, 10) > 0
        ? parseInt(options.limit, 10)
        : 10;
    const page =
      options.page && parseInt(options.page, 10) > 0
        ? parseInt(options.page, 10)
        : 1;
    const skip = (page - 1) * limit;

    let sort = { createdAt: -1 };
    if (options.sortBy) {
      const parts = options.sortBy.split(':');
      sort = { [parts[0]]: parts[1] === 'desc' ? -1 : 1 };
    }

    const [totalResults, docs] = await Promise.all([
      PlanModel.countDocuments(query),
      PlanModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.ceil(totalResults / limit);

    return {
      status: httpStatus.OK,
      message: 'Plans retrieved successfully.',
      data: docs,
      pagination: {
        totalResults,
        totalPages,
        page,
        limit,
      },
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'get-plans',
      error_data: error,
      scope: 'admin',
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error retrieving plans',
      data: [],
    };
  }
};

const getPlanById = async (planId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: 'Invalid Plan ID.',
      };
    }

    const plan = await PlanModel.findById(planId);
    if (!plan || plan.status === 2) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Plan not found.',
      };
    }

    return {
      status: httpStatus.OK,
      message: 'Plan details retrieved successfully.',
      data: plan,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'get-plan-by-id',
      error_data: error,
      scope: 'admin',
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error retrieving plan details',
    };
  }
};

const updatePlanStatus = async (planId, status, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: 'Invalid Plan ID.',
      };
    }

    const plan = await PlanModel.findById(planId);
    if (!plan) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'Plan not found.',
      };
    }

    const previousStatus = plan.status;
    plan.status = Number(status);
    if (userId) {
      plan.updatedBy = userId;
    }
    await plan.save();

    if (Number(status) === 2) {
      await systemLog(
        'DELETE',
        plan.toObject ? plan.toObject() : plan,
        userId,
        'delete-plan'
      );
    } else {
      await systemLog(
        'UPDATE',
        plan.toObject ? plan.toObject() : plan,
        userId,
        'active-deactive-plan',
        { status: previousStatus }
      );
    }

    return {
      status: httpStatus.OK,
      message:
        Number(status) === 2
          ? 'Plan deleted successfully.'
          : 'Plan status updated successfully.',
      data: plan,
    };
  } catch (error) {
    errorHandler.errorM({ action_type: 'update-plan-status', error_data: error });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message || 'Error updating plan status',
    };
  }
};

/**
 * Resolves effective plan limits for a user (or their parent organization).
 * Priority:
 * 1. Active plan in user.plans array (status === 1 || 'active' && paymentStatus === 1 || 'paid')
 * 2. user.planLimits
 * 3. Default fallback (5 marketplaces, 1000 review requests)
/**
 * Automatically evaluates a user's plans array:
 * 1. Any active plan (status: 1) with expireAt in the past is marked expired (status: 2).
 * 2. If no active plan exists, the next queued plan (status: 4) ready to activate is promoted to active (status: 1).
 * 3. user.currentPlanId and user.planLimits are updated to match the newly active plan!
 * 4. Changes are persisted to the database.
 */
const syncUserSubscriptionPlans = async (userDocOrLean: any) => {
  if (!userDocOrLean || !Array.isArray(userDocOrLean.plans) || userDocOrLean.plans.length === 0) {
    return { user: userDocOrLean, activePlan: null };
  }

  const now = Date.now();
  let hasPlanUpdated = false;

  // 1. Mark expired active plans as 2
  userDocOrLean.plans.forEach((p: any) => {
    if (
      (p.status === 1 || p.status === 'active') &&
      p.expireAt &&
      new Date(p.expireAt).getTime() < now
    ) {
      p.status = 2; // Mark as 2: expired
      hasPlanUpdated = true;
    }
  });

  // 2. Check if an active non-expired plan currently exists
  let activePlan = userDocOrLean.plans.find(
    (p: any) =>
      (p.status === 1 || p.status === 'active') &&
      (p.paymentStatus === 1 || p.paymentStatus === 'paid' || p.price === 0) &&
      (!p.expireAt || new Date(p.expireAt).getTime() >= now)
  );

  // 3. If no active plan, check for any queued plan (status === 4) that is ready to activate
  if (!activePlan) {
    const nextQueuedPlan = userDocOrLean.plans.find(
      (p: any) =>
        (p.status === 4 || p.status === 'queued') &&
        (p.paymentStatus === 1 || p.paymentStatus === 'paid' || p.price === 0) &&
        (!p.expireAt || new Date(p.expireAt).getTime() >= now)
    );

    if (nextQueuedPlan) {
      nextQueuedPlan.status = 1; // Automatically promote queued plan to active!
      userDocOrLean.currentPlanId = nextQueuedPlan.planId;
      userDocOrLean.planLimits = {
        maxMarketplaces: Number(nextQueuedPlan.marketplace) || 5,
        maxReviewRequestsPerMonth: Number(nextQueuedPlan.request_quota) || 1000,
        usedReviewRequests: userDocOrLean.planLimits?.usedReviewRequests ?? 0,
        usageMonth: userDocOrLean.planLimits?.usageMonth ?? null,
      };
      userDocOrLean.subscriptionStatus = 1; // active
      hasPlanUpdated = true;
      activePlan = nextQueuedPlan;
    }
  }

  // 4. If user has no active paid plan and payment is unpaid/pending or canceled:
  if (
    !activePlan &&
    (userDocOrLean.subscriptionStatus === 0 ||
      userDocOrLean.subscriptionStatus === 3 ||
      userDocOrLean.subscriptionStatus === 'pending_payment' ||
      userDocOrLean.subscriptionStatus === 'canceled' ||
      !userDocOrLean.subscriptionStatus)
  ) {
    if (userDocOrLean.status !== 0 || userDocOrLean.subscriptionStatus !== 3) {
      userDocOrLean.status = 0; // Inactive
      userDocOrLean.subscriptionStatus = 3; // 3: canceled
      hasPlanUpdated = true;
    }
  }

  if (hasPlanUpdated) {
    if (!activePlan && (userDocOrLean.subscriptionStatus === 1 || userDocOrLean.subscriptionStatus === 'active')) {
      userDocOrLean.subscriptionStatus = 2; // 2: expired / past_due
    }

    if (typeof userDocOrLean.save === 'function') {
      await userDocOrLean.save().catch((err: any) => {
        console.error('Failed to auto-update plans in user document:', err);
      });
    } else if (userDocOrLean._id) {
      const User = require('../models/user.model');
      await User.updateOne(
        { _id: userDocOrLean._id },
        {
          $set: {
            plans: userDocOrLean.plans,
            currentPlanId: userDocOrLean.currentPlanId,
            planLimits: userDocOrLean.planLimits,
            subscriptionStatus: userDocOrLean.subscriptionStatus,
            status: userDocOrLean.status,
          },
        }
      ).catch((err: any) => {
        console.error('Failed to update plans in user db:', err);
      });
    }
  }

  return { user: userDocOrLean, activePlan };
};

/**
 * Scans all users with active plans that have passed their expireAt, or queued plans ready for promotion.
 * Called automatically every 5 minutes by keepAlive cron or on-demand.
 */
const autoPromoteAllExpiredUserPlans = async () => {
  try {
    const User = require('../models/user.model');
    const now = new Date();

    const candidates = await User.find({
      $or: [
        {
          plans: {
            $elemMatch: {
              status: 1,
              expireAt: { $lt: now, $ne: null },
            },
          },
        },
        {
          'plans.status': 4,
        },
      ],
    });

    if (!candidates || candidates.length === 0) return 0;

    let updatedCount = 0;
    for (const user of candidates) {
      await syncUserSubscriptionPlans(user);
      updatedCount++;
    }
    return updatedCount;
  } catch (err: any) {
    console.error('Error auto-syncing expired user plans:', err?.message || err);
    return 0;
  }
};

/**
 * Synchronizes and resets seller's usedReviewRequests count for the current month.
 * If user's usageMonth is different from current month (YYYY-MM),
 * usage resets to 0 and counts only requests sent/queued in the current month.
 */
const syncUserMonthlyUsage = async (userDocOrLean: any) => {
  if (!userDocOrLean) return 0;


  const currentMonthKey = moment().format('YYYY-MM');
  const startOfMonth = moment().startOf('month').toDate();
  const userId = userDocOrLean._id || userDocOrLean.id;
  if (!userId) return 0;

  let currentMonthUsed = 0;
  try {
    currentMonthUsed = await ordermodel.countDocuments({
      userId,
      $or: [
        { isSent: true, updatedAt: { $gte: startOfMonth } },
        { isNeedToSend: true, isSent: false },
      ],
    });
  } catch (err: any) {
    console.error('Error counting monthly orders for user:', userId, err?.message);
    currentMonthUsed = 0;
  }

  // Update in-memory object
  userDocOrLean.usedReviewRequests = currentMonthUsed;
  if (!userDocOrLean.planLimits) {
    userDocOrLean.planLimits = {};
  }
  userDocOrLean.planLimits.usedReviewRequests = currentMonthUsed;
  userDocOrLean.planLimits.usageMonth = currentMonthKey;

  // Persist to DB
  try {
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          'planLimits.usageMonth': currentMonthKey,
          usedReviewRequests: currentMonthUsed,
          'planLimits.usedReviewRequests': currentMonthUsed,
        },
      }
    );
  } catch (err: any) {
    console.error('Error persisting monthly usage for user:', userId, err?.message);
  }

  return currentMonthUsed;
};

/**
 * Scans for users whose usageMonth is not current month,
 * and resets their usedReviewRequests to 0 / current month count.
 * Called automatically every 5 minutes by keepAlive cron or on-demand.
 */
const resetMonthlyUsageForAllUsers = async () => {
  try {
    const currentMonthKey = moment().format('YYYY-MM');

    const outdatedUsers = await User.find({
      $or: [
        { 'planLimits.usageMonth': { $ne: currentMonthKey } },
        { 'planLimits.usageMonth': { $exists: false } },
      ],
    }).limit(100);

    if (!outdatedUsers || outdatedUsers.length === 0) return 0;

    let updatedCount = 0;
    for (const u of outdatedUsers) {
      await syncUserMonthlyUsage(u);
      updatedCount++;
    }
    return updatedCount;
  } catch (err: any) {
    console.error('Error resetting monthly usage for all users:', err?.message || err);
    return 0;
  }
};

/**
 * Resolves effective plan limits for a user (or their parent organization).
 * Priority:
 * 1. Active plan in user.plans array (status === 1 || 'active' && paymentStatus === 1 || 'paid')
 * 2. user.planLimits
 * 3. Default fallback (5 marketplaces, 1000 review requests)
 */
const getEffectivePlanLimits = async (userOrId) => {
  let user = userOrId;
  const User = require('../models/user.model');
  if (typeof userOrId === 'string' || (userOrId && mongoose.isValidObjectId(userOrId) && !userOrId.email)) {
    user = await User.findById(userOrId);
  }
  if (!user) {
    return {
      maxMarketplaces: 5,
      maxReviewRequestsPerMonth: 1000,
      isExpired: false,
      hasActivePlan: false,
      planName: '',
      planId: null,
    };
  }

  // If user is a sub-account/team member, use parent seller's limits
  if (user.parentId) {
    const parent = await User.findById(user.parentId);
    if (parent) user = parent;
  }

  // Synchronize seller's usedReviewRequests count for current month
  const usedReviewRequests = await syncUserMonthlyUsage(user);

  // Check plans in user.plans array
  if (Array.isArray(user.plans) && user.plans.length > 0) {
    const { activePlan } = await syncUserSubscriptionPlans(user);

    if (activePlan) {
      const maxQuota = Number(activePlan.request_quota) || user.planLimits?.maxReviewRequestsPerMonth || 1000;
      return {
        maxMarketplaces: Number(activePlan.marketplace) || user.planLimits?.maxMarketplaces || 5,
        maxReviewRequestsPerMonth: maxQuota,
        usedReviewRequests,
        remainingReviewRequests: Math.max(0, maxQuota - usedReviewRequests),
        isLimitReached: usedReviewRequests >= maxQuota,
        planName: activePlan.name || '',
        planId: activePlan.planId || null,
        billingCycle: activePlan.billingCycle || 1,
        isExpired: false,
        hasActivePlan: true,
        status: activePlan.status,
        paymentStatus: activePlan.paymentStatus,
        expireAt: activePlan.expireAt,
      };
    }

    // If user has a plan that is canceled (status === 3 or subscriptionStatus === 3)
    const isLatestCanceled =
      user.subscriptionStatus === 3 ||
      user.subscriptionStatus === 'canceled' ||
      latestPlan?.status === 3 ||
      latestPlan?.status === 'canceled';

    if (isLatestCanceled) {
      return {
        maxMarketplaces: 0,
        maxReviewRequestsPerMonth: 0,
        usedReviewRequests,
        remainingReviewRequests: 0,
        isLimitReached: true,
        isExpired: false,
        isCanceled: true,
        hasActivePlan: false,
        planName: latestPlan?.name || '',
        planId: latestPlan?.planId || null,
        billingCycle: latestPlan?.billingCycle || 1,
        status: 3,
        paymentStatus: latestPlan?.paymentStatus,
        expireAt: latestPlan?.expireAt,
      };
    }

    // If user has a plan that is expired (status === 2 or past expireAt)
    const now = Date.now();
    const isLatestExpired =
      latestPlan.status === 2 ||
      latestPlan.status === 'expired' ||
      (latestPlan.expireAt && new Date(latestPlan.expireAt).getTime() < now) ||
      user.subscriptionStatus === 2 ||
      user.subscriptionStatus === 'past_due';

    if (isLatestExpired) {
      const maxQuota = Number(latestPlan.request_quota) || 1000;
      return {
        maxMarketplaces: Number(latestPlan.marketplace) || 5,
        maxReviewRequestsPerMonth: maxQuota,
        usedReviewRequests,
        remainingReviewRequests: Math.max(0, maxQuota - usedReviewRequests),
        isLimitReached: true,
        isExpired: true,
        isCanceled: false,
        hasActivePlan: false,
        planName: latestPlan.name || '',
        planId: latestPlan.planId || null,
        billingCycle: latestPlan.billingCycle || 1,
        status: 2,
        paymentStatus: latestPlan.paymentStatus,
        expireAt: latestPlan.expireAt,
      };
    }
  }

  if (user.subscriptionStatus === 3 || user.subscriptionStatus === 'canceled') {
    return {
      maxMarketplaces: 0,
      maxReviewRequestsPerMonth: 0,
      usedReviewRequests,
      remainingReviewRequests: 0,
      isLimitReached: true,
      isExpired: false,
      isCanceled: true,
      hasActivePlan: false,
      planName: '',
      planId: null,
      status: 3,
    };
  }

  // Fallback to legacy planLimits (e.g. for superadmin or un-planned users)
  const legacyQuota = user.planLimits?.maxReviewRequestsPerMonth ?? 1000;
  return {
    maxMarketplaces: user.planLimits?.maxMarketplaces ?? 5,
    maxReviewRequestsPerMonth: legacyQuota,
    usedReviewRequests,
    remainingReviewRequests: Math.max(0, legacyQuota - usedReviewRequests),
    isLimitReached: usedReviewRequests >= legacyQuota,
    planName: '',
    planId: user.currentPlanId || null,
    isExpired: false,
    hasActivePlan: false,
  };
};

/**
 * Scans all sellers whose active plan expires tomorrow (within tomorrow's calendar window),
 * and sends an email reminder if not already sent.
 * Safe to run periodically (every 5 mins or daily); tracks expirationReminderSentAt per plan.
 */
const checkAndSendPlanExpiryReminders = async () => {
  try {

    // Tomorrow calendar day window (from start of tomorrow to end of tomorrow)
    const startOfTomorrow = moment().add(1, 'day').startOf('day').toDate();
    const endOfTomorrow = moment().add(1, 'day').endOf('day').toDate();

    const candidates = await User.find({
      isEmailVerified: true,
      plans: {
        $elemMatch: {
          status: 1, // Active plan
          expireAt: { $gte: startOfTomorrow, $lte: endOfTomorrow },
          $or: [
            { expirationReminderSentAt: null },
            { expirationReminderSentAt: { $exists: false } },
          ],
        },
      },
    });

    if (!candidates || candidates.length === 0) {
      return 0;
    }

    let sentCount = 0;
    for (const user of candidates) {
      // Find the active plan that expires tomorrow and hasn't had a reminder sent yet
      const expiringPlan = (user.plans || []).find((p: any) => {
        if (p.status !== 1 || !p.expireAt) return false;
        const expDate = new Date(p.expireAt);
        const isExpiringTomorrow =
          expDate >= startOfTomorrow && expDate <= endOfTomorrow;
        const reminderNotSent = !p.expirationReminderSentAt;
        return isExpiringTomorrow && reminderNotSent;
      });

      if (!expiringPlan) continue;

      try {
        await sendPlanExpiryReminderEmail(user, expiringPlan);

        // Mark expirationReminderSentAt on this subdocument
        await User.updateOne(
          { _id: user._id, 'plans._id': expiringPlan._id },
          { $set: { 'plans.$.expirationReminderSentAt': new Date() } }
        );
        sentCount++;
        console.log(
          `[PlanExpiryReminder] Sent reminder email to ${user.email} for plan "${expiringPlan.name}" (Expires: ${moment(expiringPlan.expireAt).format('YYYY-MM-DD')})`
        );
      } catch (sendErr: any) {
        console.error(
          `[PlanExpiryReminder] Error sending email to ${user.email}:`,
          sendErr?.message || sendErr
        );
      }
    }

    return sentCount;
  } catch (err: any) {
    console.error(
      'Error checking and sending plan expiry reminders:',
      err?.message || err
    );
    return 0;
  }
};

module.exports = {
  createPlan,
  updatePlan,
  getPlans,
  getPlanById,
  updatePlanStatus,
  getEffectivePlanLimits,
  syncUserSubscriptionPlans,
  autoPromoteAllExpiredUserPlans,
  syncUserMonthlyUsage,
  resetMonthlyUsageForAllUsers,
  checkAndSendPlanExpiryReminders,
};
