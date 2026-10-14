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
    const now = Date.now();
    let hasPlanUpdated = false;

    // Check expiration on any plan with expireAt in the past
    user.plans.forEach((p: any) => {
      if (
        (p.status === 1 || p.status === 'active') &&
        p.expireAt &&
        new Date(p.expireAt).getTime() < now
      ) {
        p.status = 2; // Mark as 2: expired
        hasPlanUpdated = true;
      }
    });

    if (hasPlanUpdated) {
      if (user.subscriptionStatus === 1 || user.subscriptionStatus === 'active') {
        user.subscriptionStatus = 2; // 2: expired / past_due
      }
      user.save().catch((err: any) => {
        console.error('Failed to auto-update expired plan in user:', err);
      });
    }

    // Active & non-expired plans
    const validActivePlans = user.plans.filter(
      (p: any) =>
        (p.status === 1 || p.status === 'active') &&
        (p.paymentStatus === 1 || p.paymentStatus === 'paid' || p.price === 0) &&
        (!p.expireAt || new Date(p.expireAt).getTime() >= now)
    );

    if (validActivePlans.length > 0) {
      const latestPlan = validActivePlans[validActivePlans.length - 1];
      return {
        maxMarketplaces: Number(latestPlan.marketplace) || 5,
        maxReviewRequestsPerMonth: Number(latestPlan.request_quota) || 1000,
        planName: latestPlan.name || '',
        planId: latestPlan.planId || null,
        billingCycle: latestPlan.billingCycle || 1,
        isExpired: false,
        hasActivePlan: true,
        status: latestPlan.status,
        paymentStatus: latestPlan.paymentStatus,
        expireAt: latestPlan.expireAt,
      };
    }

    // If user has a plan that is expired (status === 2 or past expireAt)
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
};
