const Joi = require('joi');
const { objectId } = require('./custom.validation');

const permissionsSchema = Joi.object().keys({
  add: Joi.boolean().default(false),
  delete: Joi.boolean().default(false),
  update: Joi.boolean().default(false),
  view: Joi.boolean().default(false),
});

const createSection = {
  body: Joi.object().keys({
    name: Joi.string()
      .trim()
      .lowercase()
      .pattern(/^[a-z0-9_/.-]+$/)
      .message(
        'Section path must only contain lowercase alphanumeric characters, slashes, dashes, or underscores (e.g. /apps/sections, dashboard)'
      )
      .required(),
    title: Joi.string().trim().required(),
    scope: Joi.string().valid('admin', 'seller').optional(),
    permissions: permissionsSchema.optional(),
    status: Joi.number().valid(0, 1).default(1),
  }),
};

const updateSection = {
  params: Joi.object().keys({
    sectionId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string()
        .trim()
        .lowercase()
        .pattern(/^[a-z0-9_/.-]+$/)
        .optional(),
      title: Joi.string().trim().optional(),
      permissions: permissionsSchema.optional(),
      status: Joi.number().valid(0, 1).optional(),
    })
    .min(1),
};

const listSections = {
  query: Joi.object().keys({
    scope: Joi.string().valid('admin', 'seller').optional(),
    search: Joi.string().allow('').optional(),
    status: Joi.number().valid(0, 1).optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().optional(),
  }),
};

const getSectionById = {
  params: Joi.object().keys({
    sectionId: Joi.string().custom(objectId).required(),
  }),
};

const deleteSection = {
  params: Joi.object().keys({
    sectionId: Joi.string().custom(objectId).required(),
  }),
};

const toggleStatus = {
  params: Joi.object().keys({
    sectionId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    status: Joi.number().valid(0, 1).required(),
  }),
};

module.exports = {
  createSection,
  updateSection,
  listSections,
  getSectionById,
  deleteSection,
  toggleStatus,
};
