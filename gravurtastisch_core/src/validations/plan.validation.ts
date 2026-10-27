const Joi = require('joi');

const objectIdValidator = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid Mongo ObjectId');
  }
  return value;
};

const createPlan = {
  body: Joi.object().keys({
    name: Joi.string().max(100).required().trim().messages({
      'any.required': 'Plan Name is required!',
      'string.empty': 'Plan Name is required!',
      'string.max': 'Plan Name must not exceed 100 characters',
    }),
    price: Joi.number().greater(0).max(9999999).required().messages({
      'any.required': 'Price is required!',
      'number.greater': 'Price must be greater than 0!',
      'number.max': 'Price cannot exceed 9,999,999',
    }),
    currency: Joi.string().trim().lowercase().allow('', null),
    marketplace: Joi.number().integer().greater(0).max(999).messages({
      'number.greater': 'Marketplaces must be greater than 0!',
      'number.max': 'Marketplaces cannot exceed 999',
    }),
    marketplce: Joi.number().integer().greater(0).max(999),
    request_quota: Joi.number().integer().greater(0).max(9999999).required().messages({
      'any.required': 'Request Quota is required!',
      'number.greater': 'Request Quota must be greater than 0!',
      'number.max': 'Request Quota cannot exceed 9,999,999',
    }),
    expireAt: Joi.date().iso().allow(null, ''),
    billingCycle: Joi.number().valid(1, 2, 3, 12).default(1),
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
      name: Joi.string().max(100).trim().messages({
        'string.empty': 'Plan Name cannot be empty',
        'string.max': 'Plan Name must not exceed 100 characters',
      }),
      price: Joi.number().greater(0).max(9999999).messages({
        'number.greater': 'Price must be greater than 0!',
        'number.max': 'Price cannot exceed 9,999,999',
      }),
      currency: Joi.string().trim().lowercase().allow('', null),
      marketplace: Joi.number().integer().greater(0).max(999).messages({
        'number.greater': 'Marketplaces must be greater than 0!',
        'number.max': 'Marketplaces cannot exceed 999',
      }),
      marketplce: Joi.number().integer().greater(0).max(999),
      request_quota: Joi.number().integer().greater(0).max(9999999).messages({
        'number.greater': 'Request Quota must be greater than 0!',
        'number.max': 'Request Quota cannot exceed 9,999,999',
      }),
      expireAt: Joi.date().iso().allow(null, ''),
      billingCycle: Joi.number().valid(1, 2, 3, 12),
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
