const Joi = require('joi');
const { objectId } = require('./custom.validation');

const systemKey = Joi.string().trim().lowercase().min(2).max(64).required();

const generate = {
  params: Joi.object().keys({
    system: systemKey,
  }),
  body: Joi.object()
    .keys({
      generatedBy: Joi.string().trim().valid('auto', 'manual').optional(),
    })
    .default({}),
};

const current = {
  params: Joi.object().keys({
    system: systemKey,
  }),
};

const add = {
  body: Joi.object().keys({
    system: systemKey,
    otp: Joi.string()
      .trim()
      .pattern(/^\d{6}$/)
      .optional(),
    generatedBy: Joi.string().trim().valid('auto', 'manual').optional(),
    generatedAt: Joi.date().iso().optional(),
    expiresAt: Joi.date().iso().optional(),
    status: Joi.number().integer().valid(0, 1, 2).optional(),
  }),
};

const getById = {
  params: Joi.object().keys({
    id: Joi.required().custom(objectId),
  }),
};

const getBySystem = {
  params: Joi.object().keys({
    system: systemKey,
  }),
};

const update = {
  params: Joi.object().keys({
    id: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      otp: Joi.string()
        .trim()
        .pattern(/^\d{6}$/)
        .optional(),
      generatedBy: Joi.string().trim().valid('auto', 'manual').optional(),
      generatedAt: Joi.date().iso().optional(),
      expiresAt: Joi.date().iso().optional(),
      status: Joi.number().integer().valid(0, 1, 2).optional(),
    })
    .min(1),
};

const deleteById = {
  params: Joi.object().keys({
    id: Joi.required().custom(objectId),
  }),
};

const list = {
  query: Joi.object().keys({
    search: Joi.string().trim().optional().allow(''),
    status: Joi.number().integer().optional().allow(''),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

module.exports = {
  generate,
  current,
  add,
  getById,
  getBySystem,
  update,
  deleteById,
  list,
};
