// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,

    },
    marketplace: {
      type: Number,
      required: true,
      min: 0,

    },
    request_quota: {
      type: Number,
      required: true,
      min: 0,

    },
    expireAt: {
      type: Date,
      default: null,
    },
    status: {
      type: Number,
      enum: [0, 1, 2], // 0 = Inactive, 1 = Active, 2 = Deleted (soft)
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure createdAt, updatedAt, id, and _id are preserved
planSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret.__v;
    return ret;
  },
});
planSchema.set('toObject', { virtuals: true });

planSchema.plugin(paginate);

const PlanModel = mongoose.model('tbl_plans', planSchema);

module.exports = PlanModel;
