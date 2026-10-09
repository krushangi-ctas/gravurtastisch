// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const universalOtpSchema = new mongoose.Schema(
  {
    system: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    otp: {
      type: String,
      trim: true,
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    generatedBy: {
      type: String,
      trim: true,
      enum: ['auto', 'manual'],
      default: 'manual',
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

universalOtpSchema.plugin(toJSON);
universalOtpSchema.plugin(paginate);

const UniversalOtp = mongoose.model('tbl_universal_otps', universalOtpSchema);

module.exports = UniversalOtp;
