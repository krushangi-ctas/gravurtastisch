// @ts-nocheck
const mongoose = require('mongoose');

const otpSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Otp = mongoose.model('tbl_otps', otpSchema);

module.exports = Otp;
