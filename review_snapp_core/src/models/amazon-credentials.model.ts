// @ts-nocheck
const mongoose = require('mongoose');

const amazonCredentialsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'tbl_users',
      trim: true,
    },
    client_id: {
      type: String,
      trim: true,
      required: true,
    },
    client_secret: {
      type: String,
      trim: true,
      required: true,
    },
    refresh_token: {
      type: String,
      trim: true,
      required: true,
    },
    seller_id: {
      type: String,
      trim: true,
      required: true,
    },
    marketplace_id: {
      type: [String],
      trim: true,
      required: true,
    },
    auth_url: {
      type: String,
      trim: true,
      default: 'https://api.amazon.com/auth/o2/token',
    },
    sp_api_base_url: {
      type: String,
      trim: true,
      default: 'https://sellingpartnerapi-eu.amazon.com',
    },
    status: {
      type: Number,
      default: 1, // 0 - INACTIVE, 1 - ACTIVE, 2 - DELETE
    },
  },
  { timestamps: true }
);

const AmazonCredentialsModel = mongoose.model(
  'tbl_amazon_credentials',
  amazonCredentialsSchema
);

module.exports = AmazonCredentialsModel;
