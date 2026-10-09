const Joi = require('joi');

const objectIdValidator = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid Mongo ObjectId');
  }
  return value;
};

const createBlog = {
  body: Joi.object().keys({
    blog_title: Joi.string().required().trim(),
    slug: Joi.string().allow('', null).trim(),
    short_description: Joi.string().allow('', null).trim(),
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
      blog_title: Joi.string().trim(),
      slug: Joi.string().allow('', null).trim(),
      short_description: Joi.string().allow('', null).trim(),
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
