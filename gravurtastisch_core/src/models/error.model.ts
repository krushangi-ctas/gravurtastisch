// @ts-nocheck
const mongoose = require('mongoose');

const errorSchema = new mongoose.Schema(
  {
    action_type: {
      type: String,
      trim: true,
    },
    error_data: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

//model
const ErrorModel = mongoose.model('tbl_system_errors', errorSchema);

module.exports = ErrorModel;
