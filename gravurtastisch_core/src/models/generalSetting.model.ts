// @ts-nocheck
const mongoose = require('mongoose');

const generalSettingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tbl_users',
      required: true,
    },
    amazonCredentialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tbl_amazon_credentials',
    },
    activeMarketplaces: {
      type: [String],
      default: [],
    },
    activeMarketplacesLastUpdated: {
      type: Date,
    },
    campaign_name: {
      type: String,
      trim: true,
    },
    marketplace_id: {
      type: String,
      trim: true,
    },
    order_status: {
      type: String,
      trim: true,
    },
    fba: {
      type: Boolean,
      default: false,
    },
    fbm: {
      type: Boolean,
      default: false,
    },
    // New schedule fields
    hour: {
      type: Number,
      min: 0,
      max: 23, // 24-hour format
      default: 0,
    },
    minute: {
      type: Number,
      min: 0,
      max: 59,
      default: 0,
    },
    second: {
      type: Number,
      min: 0,
      max: 59,
      default: 0,
    },
    day: {
      type: Number,
      min: 1,
      max: 31,
      default: 1,
    },
    order_matching_rules: {
      type: String,
      trim: true,
    },
    status: {
      type: Number,
      default: 0, // 0 - INACTIVE, 1 - ACTIVE, 2 - DELETE
    },
    autoSendRequest: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const GeneralSettingModel = mongoose.model(
  'tbl_general_settings',
  generalSettingSchema
);

module.exports = GeneralSettingModel;
