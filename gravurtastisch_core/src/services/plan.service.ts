// @ts-nocheck
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const PlanModel = require('../models/plan.model');

const createPlan = async (bodyData, userId) => {
  const payload = {
    name: bodyData.name,
    price: Number(bodyData.price),
    marketplace: Number(bodyData.marketplace ?? bodyData.marketplce ?? 0),
    request_quota: Number(bodyData.request_quota ?? 0),
    expireAt: bodyData.expireAt ? new Date(bodyData.expireAt) : null,
    billingCycle: bodyData.billingCycle !== undefined ? Number(bodyData.billingCycle) : 1,
    status: bodyData.status !== undefined ? Number(bodyData.status) : 1,
    createdBy: userId || null,
  };

  const plan = await PlanModel.create(payload);
  return {
    status: httpStatus.CREATED,
    message: 'Plan created successfully.',
    data: plan,
  };
};

const updatePlan = async (planId, updateData, userId) => {
  const existingPlan = await PlanModel.findById(planId);
  if (!existingPlan || existingPlan.status === 2) {
    return {
      status: httpStatus.NOT_FOUND,
      message: 'Plan not found.',
    };
  }

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

  return {
    status: httpStatus.OK,
    message: 'Plan updated successfully.',
    data: updatedPlan,
  };
};

const getPlans = async (filter = {}, options = {}) => {
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
};

const getPlanById = async (planId) => {
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
};

const updatePlanStatus = async (planId, status, userId) => {
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

  plan.status = Number(status);
  if (userId) {
    plan.updatedBy = userId;
  }
  await plan.save();

  return {
    status: httpStatus.OK,
    message:
      Number(status) === 2
        ? 'Plan deleted successfully.'
        : 'Plan status updated successfully.',
    data: plan,
  };
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
      };
      userDocOrLean.subscriptionStatus = 1; // active
      hasPlanUpdated = true;
      activePlan = nextQueuedPlan;
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

  // Check plans in user.plans array
  if (Array.isArray(user.plans) && user.plans.length > 0) {
    const { activePlan } = await syncUserSubscriptionPlans(user);

    if (activePlan) {
      return {
        maxMarketplaces: Number(activePlan.marketplace) || user.planLimits?.maxMarketplaces || 5,
        maxReviewRequestsPerMonth: Number(activePlan.request_quota) || user.planLimits?.maxReviewRequestsPerMonth || 1000,
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

    // If user has a plan that is expired (status === 2 or past expireAt)
    const now = Date.now();
    const latestPlan = user.plans[user.plans.length - 1];
    const isLatestExpired =
      latestPlan.status === 2 ||
      latestPlan.status === 'expired' ||
      (latestPlan.expireAt && new Date(latestPlan.expireAt).getTime() < now) ||
      user.subscriptionStatus === 2 ||
      user.subscriptionStatus === 'past_due';

    if (isLatestExpired) {
      return {
        maxMarketplaces: Number(latestPlan.marketplace) || 5,
        maxReviewRequestsPerMonth: Number(latestPlan.request_quota) || 1000,
        planName: latestPlan.name || '',
        planId: latestPlan.planId || null,
        billingCycle: latestPlan.billingCycle || 1,
        isExpired: true,
        hasActivePlan: false,
        status: 2,
        paymentStatus: latestPlan.paymentStatus,
        expireAt: latestPlan.expireAt,
      };
    }
  }

  // Fallback to legacy planLimits (e.g. for superadmin or un-planned users)
  return {
    maxMarketplaces: user.planLimits?.maxMarketplaces ?? 5,
    maxReviewRequestsPerMonth: user.planLimits?.maxReviewRequestsPerMonth ?? 1000,
    planName: '',
    planId: user.currentPlanId || null,
    isExpired: false,
    hasActivePlan: false,
  };
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
};
