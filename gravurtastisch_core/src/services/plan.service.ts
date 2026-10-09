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

module.exports = {
  createPlan,
  updatePlan,
  getPlans,
  getPlanById,
  updatePlanStatus,
};
