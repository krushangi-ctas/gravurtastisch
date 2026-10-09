const Joi = require('joi');

const createSupportRequest = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } }),
    message: Joi.string().required(),
  }),
};

const updateSupportRequestStatus = {
  params: Joi.object().keys({
    requestId: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          return helpers.message('"requestId" must be a valid Mongo ObjectId');
        }
        return value;
      }),
  }),
  body: Joi.object().keys({
    status: Joi.string().required().valid('pending', 'resolved'),
  }),
};

module.exports = {
  createSupportRequest,
  updateSupportRequestStatus,
};
