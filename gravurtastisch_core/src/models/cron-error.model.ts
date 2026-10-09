// @ts-nocheck
const mongoose = require('mongoose');

const errorSchema = new mongoose.Schema(
  {
    any: {},
  },
  { strict: false, timestamps: true }
);
//model
const ErrorModel = mongoose.model('tbl_cron_errors', errorSchema);

module.exports = ErrorModel;
