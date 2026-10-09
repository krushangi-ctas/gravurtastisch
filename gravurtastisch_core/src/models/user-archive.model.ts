// @ts-nocheck
const mongoose = require('mongoose');

const userArchiveSchema = mongoose.Schema(
  {
    originalId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    contact_no: {
      type: String,
      trim: true,
    },
    role_id: {
      type: mongoose.Types.ObjectId,
    },
    address: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    marketplaces: {
      type: [String],
      default: [],
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    planLimits: {
      maxMarketplaces: { type: Number },
      maxReviewRequestsPerMonth: { type: Number },
    },
    status: {
      type: Number,
    },
    archivedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userArchiveSchema.index({ archivedAt: 1 }, { expireAfterSeconds: 432000 }); // 5 days = 432000 seconds

const UserArchive = mongoose.model('tbl_users_archive', userArchiveSchema);

module.exports = UserArchive;
