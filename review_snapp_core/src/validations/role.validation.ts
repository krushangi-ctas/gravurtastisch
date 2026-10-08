const Joi = require('joi');
const { objectId } = require('./custom.validation');

const permissionItem = Joi.object({
  section: Joi.string().trim().required(),
  canView: Joi.boolean().default(false),
  canCreate: Joi.boolean().default(false),
  canUpdate: Joi.boolean().default(false),
  canDelete: Joi.boolean().default(false),
});

const getSections = {
  query: Joi.object().keys({
    scope: Joi.string().valid('admin', 'seller').optional(),
  }),
};

const createRole = {
  body: Joi.object().keys({
    role_name: Joi.string().trim().required(),
    description: Joi.string().trim().allow('').optional(),
    scope: Joi.string().valid('admin', 'seller').optional(),
    permissions: Joi.array().items(permissionItem).min(1).required(),
  }),
};

const updateRole = {
  params: Joi.object().keys({
    roleId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      role_name: Joi.string().trim().optional(),
      description: Joi.string().trim().allow('').optional(),
      permissions: Joi.array().items(permissionItem).optional(),
      status: Joi.number().valid(0, 1).optional(),
    })
    .min(1),
};

const listRoles = {
  query: Joi.object().keys({
    scope: Joi.string().valid('admin', 'seller').optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
    search: Joi.string().allow('').optional(),
  }),
};

const getRoleById = {
  params: Joi.object().keys({
    roleId: Joi.string().custom(objectId).required(),
  }),
};

const deleteRole = {
  params: Joi.object().keys({
    roleId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  getSections,
  createRole,
  updateRole,
  listRoles,
  getRoleById,
  deleteRole,
};
