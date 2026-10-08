// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const blogSchema = new mongoose.Schema(
  {
    blog_title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    short_description: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    description_images: {
      type: [String],
      default: [],
    },
    status: {
      type: Number,
      enum: [0, 1, 2], // 0 = Inactive, 1 = Active, 2 = Deleted (soft)
      default: 1,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugins that convert mongoose to json and paginate
blogSchema.plugin(toJSON);
blogSchema.plugin(paginate);

const BlogModel = mongoose.model('tbl_blogs', blogSchema);

module.exports = BlogModel;
