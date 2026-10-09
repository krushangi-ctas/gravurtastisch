// @ts-nocheck
const fs = require('fs');
const path = require('path');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const BlogModel = require('../models/blog.model');
const config = require('../config/config');

const getBaseUrl = () => {
  return config.site_url || process.env.BASE_URL;
};

const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const createUniqueSlug = async (title, currentBlogId = null) => {
  let baseSlug = generateSlug(title);
  if (!baseSlug) {
    baseSlug = 'blog-post';
  }
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const query = { slug, status: { $ne: 2 } };
    if (currentBlogId) {
      query._id = { $ne: currentBlogId };
    }
    const exists = await BlogModel.findOne(query);
    if (!exists) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

const formatBlogResponse = (blogDoc) => {
  if (!blogDoc) return null;
  const blog =
    typeof blogDoc.toObject === 'function'
      ? blogDoc.toObject()
      : { ...blogDoc };
  const baseUrl = getBaseUrl().replace(/\/+$/, '');

  if (!blog.slug && blog.blog_title) {
    blog.slug = generateSlug(blog.blog_title);
  }

  // Add full image URLs for convenience while keeping relative paths intact
  if (Array.isArray(blog.description_images)) {
    blog.full_image_urls = blog.description_images.map((img) => {
      if (!img) return '';
      if (img.startsWith('http://') || img.startsWith('https://')) return img;
      const cleanPath = img.replace(/^\/+/, '');
      return `${baseUrl}/${cleanPath}`;
    });
  } else {
    blog.full_image_urls = [];
  }

  return blog;
};

const createBlog = async (bodyData, userId) => {
  const slug = await createUniqueSlug(bodyData.blog_title || 'blog-post');

  const payload = {
    ...bodyData,
    slug,
    created_by: userId || null,
  };

  const blog = await BlogModel.create(payload);
  return {
    status: httpStatus.CREATED,
    message: 'Blog created successfully.',
    data: formatBlogResponse(blog),
  };
};

const updateBlog = async (blogId, updateData, userId) => {
  const existingBlog = await BlogModel.findById(blogId);
  if (!existingBlog || existingBlog.status === 2) {
    return {
      status: httpStatus.NOT_FOUND,
      message: 'Blog not found.',
    };
  }

  let slug = existingBlog.slug;
  // If blog title is being updated or slug is missing, automatically re-generate slug from title
  if (
    updateData.blog_title &&
    updateData.blog_title.trim() !== existingBlog.blog_title
  ) {
    slug = await createUniqueSlug(
      updateData.blog_title.trim(),
      existingBlog._id
    );
  } else if (!slug) {
    slug = await createUniqueSlug(existingBlog.blog_title, existingBlog._id);
  }

  const payload = {
    ...updateData,
    slug,
    updated_by: userId || null,
  };

  const updatedBlog = await BlogModel.findByIdAndUpdate(
    blogId,
    { $set: payload },
    { new: true }
  );

  return {
    status: httpStatus.OK,
    message: 'Blog updated successfully.',
    data: formatBlogResponse(updatedBlog),
  };
};

const getBlogs = async (filter = {}, options = {}) => {
  const query = {};

  if (
    filter.status !== undefined &&
    filter.status !== null &&
    filter.status !== ''
  ) {
    query.status = Number(filter.status);
  } else {
    // Default: exclude soft-deleted blogs (status = 2)
    query.status = { $ne: 2 };
  }

  if (filter.search) {
    const searchRegex = { $regex: filter.search.trim(), $options: 'i' };
    query.$or = [
      { blog_title: searchRegex },
      { short_description: searchRegex },
      { slug: searchRegex },
    ];
  }

  const limit =
    options.limit && parseInt(options.limit, 10) > 0
      ? parseInt(options.limit, 10)
      : 10;
  const page =
    options.page && parseInt(options.page, 10) > 0
      ? parseInt(options.page, 10)
      : 1;
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (options.sortBy) {
    const parts = options.sortBy.split(':');
    sort = { [parts[0]]: parts[1] === 'desc' ? -1 : 1 };
  }

  const [totalResults, docs] = await Promise.all([
    BlogModel.countDocuments(query),
    BlogModel.find(query).sort(sort).skip(skip).limit(limit),
  ]);

  for (const doc of docs) {
    if (!doc.slug && doc.blog_title) {
      doc.slug = generateSlug(doc.blog_title);
      BlogModel.updateOne({ _id: doc._id }, { $set: { slug: doc.slug } })
        .exec()
        .catch(() => { });
    }
  }

  const totalPages = Math.ceil(totalResults / limit);
  const formattedDocs = docs.map(formatBlogResponse);

  return {
    status: httpStatus.OK,
    message: 'Blogs retrieved successfully.',
    data: formattedDocs,
    pagination: {
      totalResults,
      totalPages,
      page,
      limit,
    },
  };
};

const getBlogById = async (identifier) => {
  let blog = null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    blog = await BlogModel.findById(identifier);
  }

  if (!blog) {
    blog = await BlogModel.findOne({ slug: identifier });
  }

  if (!blog || blog.status === 2) {
    return {
      status: httpStatus.NOT_FOUND,
      message: 'Blog not found.',
    };
  }

  if (!blog.slug && blog.blog_title) {
    blog.slug = await createUniqueSlug(blog.blog_title, blog._id);
    await blog.save();
  }

  return {
    status: httpStatus.OK,
    message: 'Blog details retrieved successfully.',
    data: formatBlogResponse(blog),
  };
};

const updateBlogStatus = async (blogId, status, userId) => {
  const blog = await BlogModel.findById(blogId);
  if (!blog) {
    return {
      status: httpStatus.NOT_FOUND,
      message: 'Blog not found.',
    };
  }

  blog.status = Number(status);
  if (userId) {
    blog.updated_by = userId;
  }
  await blog.save();

  return {
    status: httpStatus.OK,
    message:
      Number(status) === 2
        ? 'Blog deleted successfully.'
        : 'Blog status updated successfully.',
    data: formatBlogResponse(blog),
  };
};

const saveUploadedImage = async (file) => {
  if (!file) {
    return {
      status: httpStatus.BAD_REQUEST,
      message: 'No file provided.',
    };
  }

  const uploadDir = path.join(__dirname, '../uploads/blogs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext =
    path
      .extname(file.name || file.originalFilename || file.path || '')
      .toLowerCase() || '.png';
  const uniqueName = `${Date.now()}-${Math.floor(
    100000000 + Math.random() * 900000000
  )}${ext}`;
  const targetPath = path.join(uploadDir, uniqueName);

  // If file was uploaded to a temp path (connect-multiparty / multer), move/copy it
  if (file.path && fs.existsSync(file.path)) {
    fs.copyFileSync(file.path, targetPath);
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      // ignore unlink error on temp file
    }
  } else if (file.buffer) {
    fs.writeFileSync(targetPath, file.buffer);
  }

  const relativePath = `blogs/${uniqueName}`;
  const baseUrl = getBaseUrl().replace(/\/+$/, '');
  const fullUrl = `${baseUrl}/${relativePath}`;

  return {
    status: httpStatus.OK,
    message: 'Image uploaded successfully.',
    data: {
      relativePath,
      filename: uniqueName,
      url: fullUrl,
    },
  };
};

module.exports = {
  createBlog,
  updateBlog,
  getBlogs,
  getBlogById,
  updateBlogStatus,
  saveUploadedImage,
};
