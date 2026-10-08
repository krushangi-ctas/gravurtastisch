// @ts-nocheck
const mongoose = require('mongoose');

const marketplaceSchema = new mongoose.Schema(
  {
    marketplace_id: {
      type: String,
      trim: true,
    },
    country_code: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    status: {
      type: Number,
      default: 1, // 0 - INACTIVE, 1 - ACTIVE, 2 - DELETE
    },
  },
  { timestamps: true }
);

const MarketplaceModel = mongoose.model('tbl_marketplaces', marketplaceSchema);

module.exports = MarketplaceModel;
