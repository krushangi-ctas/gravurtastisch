const Joi = require('joi');

const objectIdValidator = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid Mongo ObjectId');
  }
  return value;
};

const createCheckout = {
  body: Joi.object().keys({
    planId: Joi.string().required().custom(objectIdValidator),
    email: Joi.string().required().email().trim().lowercase(),
    name: Joi.string().allow('', null).trim().max(120),
  }),
};

const getSession = {
  params: Joi.object().keys({
    sessionId: Joi.string().required().trim(),
  }),
};

module.exports = {
  createCheckout,
  getSession,
};
