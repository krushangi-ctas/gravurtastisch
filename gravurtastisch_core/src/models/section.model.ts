// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const sectionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      enum: ['admin', 'seller'],
      required: true,
      index: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Types.ObjectId,
      ref: 'tbl_users',
      default: null,
      index: true,
    },
    permissions: {
      add: { type: Boolean, default: true },
      delete: { type: Boolean, default: true },
      update: { type: Boolean, default: true },
      view: { type: Boolean, default: true },
    },
    status: {
      type: Number,
      default: 1, // 0: inactive, 1: active, 2: deleted
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

sectionSchema.index(
  { name: 1, scope: 1, ownerId: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 2 } } }
);

sectionSchema.plugin(toJSON);
sectionSchema.plugin(paginate);

/**
 * @typedef Section
 */
const Section = mongoose.model('tbl_sections', sectionSchema);

module.exports = Section;
