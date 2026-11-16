const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createModule = {
  body: Joi.object().keys({
    title: Joi.string().required().trim().messages({
      'any.required': 'Module Title is required!',
      'string.empty': 'Module Title is required!',
    }),
    moduleName: Joi.string().allow('', null).trim(),
    description: Joi.string().allow('', null).trim(),
    parentId: Joi.string().allow('', null).custom(objectId),
    sortOrder: Joi.number().integer().default(0),
    isPublished: Joi.boolean().default(false),
    isAdminSection: Joi.boolean().default(true),
    status: Joi.number().valid(0, 1, 2).default(1),
  }),
};

const updateModule = {
  params: Joi.object().keys({
    moduleId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    title: Joi.string().trim(),
    moduleName: Joi.string().allow('', null).trim(),
    description: Joi.string().allow('', null).trim(),
    parentId: Joi.string().allow('', null).custom(objectId),
    sortOrder: Joi.number().integer(),
    isPublished: Joi.boolean(),
    isAdminSection: Joi.boolean(),
    status: Joi.number().valid(0, 1, 2),
  }),
};

const getModuleById = {
  params: Joi.object().keys({
    moduleId: Joi.string().required().custom(objectId),
  }),
};

const deleteModule = {
  params: Joi.object().keys({
    moduleId: Joi.string().required().custom(objectId),
  }),
};

const createStep = {
  params: Joi.object().keys({
    moduleId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    title: Joi.string().allow('', null).trim(),
    description: Joi.string().allow('', null),
    screenshotUrl: Joi.string().allow('', null).trim(),
    stepOrder: Joi.number().integer().required().messages({
      'any.required': 'Step Order is required!',
    }),
  }),
};

const updateStep = {
  params: Joi.object().keys({
    stepId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    title: Joi.string().allow('', null).trim(),
    description: Joi.string().allow('', null),
    screenshotUrl: Joi.string().allow('', null).trim(),
    stepOrder: Joi.number().integer(),
    status: Joi.number().valid(0, 1, 2),
  }),
};

const deleteStep = {
  params: Joi.object().keys({
    stepId: Joi.string().required().custom(objectId),
  }),
};

const reorderSteps = {
  params: Joi.object().keys({
    moduleId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    steps: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.string().required().custom(objectId),
          stepOrder: Joi.number().integer().required(),
        })
      )
      .required(),
  }),
};

const reorderModules = {
  body: Joi.object().keys({
    parents: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.string().required().custom(objectId),
          sortOrder: Joi.number().integer().required(),
        })
      )
      .default([]),
    children: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.string().required().custom(objectId),
          parentId: Joi.string().required().custom(objectId),
          sortOrder: Joi.number().integer().required(),
        })
      )
      .default([]),
  }),
};

const publishedTree = {
  query: Joi.object().keys({
    isAdminSection: Joi.alternatives().try(Joi.boolean(), Joi.string()).allow('', null),
    search: Joi.string().allow('', null),
  }),
};

const publishedChild = {
  params: Joi.object().keys({
    childModuleId: Joi.string().required().custom(objectId),
  }),
};

const getModules = {
  query: Joi.object().keys({
    search: Joi.string().allow('', null),
    status: Joi.number().valid(0, 1, 2),
    isAdminSection: Joi.alternatives().try(Joi.boolean(), Joi.string()).allow('', null),
    sortBy: Joi.string().allow('', null),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

module.exports = {
  createModule,
  updateModule,
  getModuleById,
  deleteModule,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
  reorderModules,
  publishedTree,
  publishedChild,
  getModules,
};
