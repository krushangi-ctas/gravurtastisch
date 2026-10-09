const Joi = require('joi');

const objectIdValidator = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid Mongo ObjectId');
  }
  return value;
};

const createPlan = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    price: Joi.number().min(0).required(),
    marketplace: Joi.number().integer().min(0),
    marketplce: Joi.number().integer().min(0),
    request_quota: Joi.number().integer().min(0).required(),
    expireAt: Joi.date().iso().allow(null, ''),
    status: Joi.number().valid(0, 1, 2).default(1),
  }).or('marketplace', 'marketplce'),
};

const getPlans = {
  query: Joi.object().keys({
    search: Joi.string().allow(''),
    status: Joi.number().valid(0, 1, 2),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPlan = {
  params: Joi.object().keys({
    planId: Joi.string().required().custom(objectIdValidator),
  }),
};

const updatePlan = {
  params: Joi.object().keys({
    planId: Joi.string().required().custom(objectIdValidator),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      price: Joi.number().min(0),
      marketplace: Joi.number().integer().min(0),
      marketplce: Joi.number().integer().min(0),
      request_quota: Joi.number().integer().min(0),
      expireAt: Joi.date().iso().allow(null, ''),
      status: Joi.number().valid(0, 1, 2),
    })
    .min(1),
};

const updatePlanStatus = {
  params: Joi.object().keys({
    planId: Joi.string().required().custom(objectIdValidator),
  }),
  body: Joi.object().keys({
    status: Joi.number().required().valid(0, 1, 2),
  }),
};

module.exports = {
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  updatePlanStatus,
};
