const Joi = require('joi');
const { objectId } = require('./custom.validation');

const addEmailTemplate = {
  body: Joi.object().keys({
    subject: Joi.string().required().trim(),
    content: Joi.string().required().trim(),
    status: Joi.number().integer().valid(0, 1, 2).default(1),
  }),
};

const updateEmailTemplate = {
  params: Joi.object().keys({
    emailTemplateId: Joi.required().custom(objectId),
    userId: Joi.required().custom(objectId),
    body: Joi.object().keys({
      title: Joi.string().allow(''),
      subject: Joi.string().allow(''),
      content: Joi.string().allow(''),
    }),
  }),
};

const getAllEmailTemplate = {
  query: Joi.object().keys({
    search: Joi.string().optional().allow(''),
    sortBy: Joi.string().optional().allow(''),
    limit: Joi.number().integer().optional().allow(''),
    status: Joi.string().allow(''),
    page: Joi.number().integer().optional().allow(''),
  }),
};

const findEmailTemplateById = {
  params: Joi.object().keys({
    emailTemplateId: Joi.required().custom(objectId),
    userId: Joi.required().custom(objectId),
  }),
};

module.exports = {
  addEmailTemplate,
  updateEmailTemplate,
  getAllEmailTemplate,
  findEmailTemplateById,
};
