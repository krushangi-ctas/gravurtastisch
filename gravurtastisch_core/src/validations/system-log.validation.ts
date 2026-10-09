const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getSystemLogByDate = {
  query: Joi.object().keys({
    search: Joi.string().optional().allow(''),
    sortBy: Joi.string().optional().allow(''),
    limit: Joi.number().integer().optional().allow(''),
    page: Joi.number().integer().optional().allow(''),
    startDate: Joi.string().allow(''),
    endDate: Joi.string().allow(''),
    operation_by: Joi.string().allow(''),
    operation: Joi.string().allow(''),
  }),
};

const getCommonUserValidate = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).allow(),
  }),
};

module.exports = {
  getSystemLogByDate,
  getCommonUserValidate,
};
