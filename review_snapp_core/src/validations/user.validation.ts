const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    address: Joi.string().trim().optional(),
    contact_no: Joi.string().trim().allow('', null).optional(),
    avatar: Joi.any(),
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } })
      .trim(),
    password: Joi.string().custom(password).trim().optional(),
    confirm_password: Joi.string().trim().optional(),
    role_id: Joi.string().custom(objectId).required(),
    scope: Joi.string().valid('admin', 'seller').optional(),
    status: Joi.number().valid(0, 1).optional(),
  }),
};

const createTeamUser = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } })
      .trim(),
    contact_no: Joi.string().trim().allow('', null).optional(),
    role_id: Joi.string().custom(objectId).required(),
    scope: Joi.string().valid('seller').default('seller'),
    status: Joi.number().valid(0, 1).optional(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    search: Joi.string().optional().allow(''),
    status: Joi.string().optional().allow(''),
    key: Joi.string().optional().allow(''),
    sortBy: Joi.string().optional().allow(''),
    limit: Joi.number().integer().optional().allow(''),
    page: Joi.number().integer().optional().allow(''),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId).required(),
    // loginId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      // address: Joi.string().trim(),
      contact_no: Joi.string().trim(),
      email: Joi.string()
        .required()
        .email({ tlds: { allow: false } })
        .trim(),
      role_id: Joi.string().custom(objectId).optional(),
      password: Joi.string().allow('').optional().custom(password).trim(),
      confirm_password: Joi.string()
        .allow('')
        .optional()
        .custom(password)
        .trim(),
      // avatar: Joi.any(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    loginId: Joi.string().custom(objectId),
  }),
};

const registerSeller = {
  body: Joi.object().keys({
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } })
      .trim(),
    seller: Joi.string().required(),
    business: Joi.string().required(),
    phone: Joi.string().allow('', null).trim(),
    marketplaces: Joi.array().items(Joi.string()).default([]),
  }),
};

module.exports = {
  createUser,
  createTeamUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  registerSeller,
};
