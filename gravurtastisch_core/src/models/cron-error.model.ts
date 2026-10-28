// @ts-nocheck
const mongoose = require('mongoose');

const errorSchema = new mongoose.Schema(
  {
    action_type: {
      type: String,
      trim: true,
      index: true,
    },
    scope: {
      type: String,
      trim: true,
      default: 'admin',
      index: true,
    },
    error_data: {
      type: mongoose.Schema.Types.Mixed,
    },
    operation_by: {
      type: mongoose.Types.ObjectId,
    },
    ip_address: {
      type: String,
      trim: true,
    },
  },
  { strict: false, timestamps: true }
);

const ErrorModel = mongoose.model('tbl_cron_errors', errorSchema);

module.exports = ErrorModel;
