// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const guideStepSchema = new mongoose.Schema(
  {
    guideModuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tbl_guide_modules',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    screenshotUrl: {
      type: String,
      trim: true,
      default: '',
    },
    stepOrder: {
      type: Number,
      required: true,
      default: 1,
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

guideStepSchema.plugin(toJSON);
guideStepSchema.plugin(paginate);

const GuideStepModel = mongoose.model('tbl_guide_steps', guideStepSchema);

module.exports = GuideStepModel;
