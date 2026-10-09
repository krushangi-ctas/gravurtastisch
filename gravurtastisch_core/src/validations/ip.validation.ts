const Joi = require('joi');

const addIp = {
  body: Joi.object().keys({
    ip: Joi.string()
      .required()
      .ip({ version: ['ipv4', 'ipv6'] }),
    status: Joi.number().valid(0, 1, 2).default(1),
    //warehouse_id: Joi.string().required().custom(objectIdValidation, "ObjectId Validation"),
    //store_id: Joi.string().required().custom(objectIdValidation, "ObjectId Validation"),
  }),
};

const updateIp = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    ip: Joi.string()
      .custom((value, helpers) => {
        const ipv4Pattern =
          /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}$/;
        const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)$/;

        if (ipv4Pattern.test(value) || ipv6Pattern.test(value)) {
          return value;
        } else {
          return helpers.error('any.invalid');
        }
      })
      .messages({
        'any.invalid': 'Invalid IP address. Must be IPv4 or IPv6.',
      }),
    status: Joi.number().valid(0, 1, 2).optional(),
    warehouse_id: Joi.string().optional(),
    store_id: Joi.string().optional(),
  }),
};

const deleteIp = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const getIpList = {
  query: Joi.object().keys({
    search: Joi.string().allow('').optional(),
    status: Joi.number().valid(0, 1, 2).optional(),
    warehouse_id: Joi.string().optional(),
    store_id: Joi.string().optional(),
    sortBy: Joi.string().allow('').optional(),
    limit: Joi.number().integer().min(1).optional(),
    page: Joi.number().integer().min(1).optional(),
  }),
};

const getIpById = {
  params: Joi.object().keys({
    id: Joi.string().required(), // Ensures 'id' is a required string
  }),
};

module.exports = {
  addIp,
  updateIp,
  deleteIp,
  getIpList,
  getIpById, // <-- Add this line to export the validation
};
