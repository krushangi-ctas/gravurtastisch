const Joi = require('joi');
const { objectId } = require('./custom.validation'); // Ensure the path is correct

const getSectionList = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'name', 'title').default('createdAt'),
  search: Joi.string().allow(''),
});

const createSection = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    title: Joi.string().optional().trim(),
    status: Joi.number().valid(0, 1, 2).default(1).optional(),
    permissions: Joi.object().optional(),
  }),
  params: Joi.object().keys({
    userId: Joi.custom(objectId).required(), // Using custom ObjectId validation
  }),
};

const updateSectionById = {
  body: Joi.object().keys({
    title: Joi.string().trim().optional(),
    name: Joi.string().trim().optional(),
    status: Joi.number().valid(0, 1, 2).optional(),
    permissions: Joi.object().optional(),
  }),
  params: Joi.object().keys({
    sectionId: Joi.custom(objectId).required(), // Using custom ObjectId validation
    userId: Joi.custom(objectId).required(), // Using custom ObjectId validation
  }),
};

//  Validation for Get Section by ID
const getSectionById = {
  params: Joi.object().keys({
    sectionId: Joi.custom(objectId).required(), // Using custom ObjectId validation
  }),
};

//  Validation for Deleting a Section
const deleteSectionById = {
  params: Joi.object().keys({
    sectionId: Joi.custom(objectId).required(), // Using custom ObjectId validation
  }),
};

module.exports = {
  createSection,
  updateSectionById,
  getSectionList,
  getSectionById,
  deleteSectionById,
};
