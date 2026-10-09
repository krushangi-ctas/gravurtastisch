const Joi = require('joi');

const getOrders = {
  query: Joi.object().keys({
    search: Joi.string().optional().allow(''),
    status: Joi.string().optional().allow(''),
    key: Joi.string().optional().allow(''),
    sortBy: Joi.string().optional().allow(''),
    limit: Joi.number().integer().optional().allow(''),

    page: Joi.number().integer().optional().allow(''),
  }),
};

module.exports = {
  getOrders,
};
