const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const blogService = require('../services/blog.service');

const createBlog = catchAsync(async (req, res) => {
  const result = await blogService.createBlog(
    req.body,
    req.user ? req.user._id : null
  );
  res.status(result.status).send(result);
});

const updateBlog = catchAsync(async (req, res) => {
  const result = await blogService.updateBlog(
    req.params.blogId,
    req.body,
    req.user ? req.user._id : null
  );
  res.status(result.status).send(result);
});

const getBlogs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await blogService.getBlogs(filter, options);
  res.status(result.status).send(result);
});

const getBlog = catchAsync(async (req, res) => {
  const result = await blogService.getBlogById(req.params.blogId);
  res.status(result.status).send(result);
});

const updateStatus = catchAsync(async (req, res) => {
  const result = await blogService.updateBlogStatus(
    req.params.blogId,
    req.body.status,
    req.user ? req.user._id : null
  );
  res.status(result.status).send(result);
});

const uploadImage = catchAsync(async (req, res) => {
  const file = (req.files && (req.files.image || req.files.file)) || req.file;
  if (!file) {
    return res.status(httpStatus.BAD_REQUEST).send({
      status: httpStatus.BAD_REQUEST,
      message: 'Image file is required (field name: "image" or "file")',
    });
  }
  const result = await blogService.saveUploadedImage(file);
  res.status(result.status).send(result);
});

module.exports = {
  createBlog,
  updateBlog,
  getBlogs,
  getBlog,
  updateStatus,
  uploadImage,
};
