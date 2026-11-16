// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const guideModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    moduleName: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GuideModule',
      default: null,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isAdminSection: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: Number,
      enum: [0, 1, 2], // 0 = Inactive, 1 = Active, 2 = Deleted (soft)
      default: 1,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
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

guideModuleSchema.plugin(toJSON);
guideModuleSchema.plugin(paginate);

const GuideModuleModel = mongoose.model('tbl_guide_modules', guideModuleSchema);

module.exports = GuideModuleModel;
