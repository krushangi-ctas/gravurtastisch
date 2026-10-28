const Joi = require('joi');

const objectIdValidator = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid Mongo ObjectId');
  }
  return value;
};

const createBlog = {
  body: Joi.object().keys({
    blog_title: Joi.string().max(100).required().trim().messages({
      'any.required': 'Blog Title is required!',
      'string.empty': 'Blog Title is required!',
      'string.max': 'Blog Title must not exceed 100 characters',
    }),
    slug: Joi.string().allow('', null).trim(),
    short_description: Joi.string().max(200).allow('', null).trim().messages({
      'string.max': 'Short Description must not exceed 200 characters',
    }),
    description: Joi.alternatives()
      .try(Joi.object(), Joi.string(), Joi.any())
      .allow(null),
    description_images: Joi.array().items(Joi.string()).default([]),
    status: Joi.number().valid(0, 1, 2).default(1),
  }),
};

const getBlogs = {
  query: Joi.object().keys({
    search: Joi.string().allow(''),
    status: Joi.number().valid(0, 1, 2),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().required().trim(),
  }),
};

const updateBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().required().custom(objectIdValidator),
  }),
  body: Joi.object()
    .keys({
      blog_title: Joi.string().max(100).trim().messages({
        'string.empty': 'Blog Title cannot be empty',
        'string.max': 'Blog Title must not exceed 100 characters',
      }),
      slug: Joi.string().allow('', null).trim(),
      short_description: Joi.string().max(200).allow('', null).trim().messages({
        'string.max': 'Short Description must not exceed 200 characters',
      }),
      description: Joi.alternatives()
        .try(Joi.object(), Joi.string(), Joi.any())
        .allow(null),
      description_images: Joi.array().items(Joi.string()),
      status: Joi.number().valid(0, 1, 2),
    })
    .min(1),
};

const updateBlogStatus = {
  params: Joi.object().keys({
    blogId: Joi.string().required().custom(objectIdValidator),
  }),
  body: Joi.object().keys({
    status: Joi.number().required().valid(0, 1, 2),
  }),
};

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  updateBlogStatus,
};
