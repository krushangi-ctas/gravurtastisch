// @ts-nocheck
/**
 * Legacy placeholder referenced by common.service Amazon inventory helpers.
 */
const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true, collection: 'tbl_amz_in_inventories' }
);

module.exports =
  mongoose.models.tbl_amz_in_inventories ||
  mongoose.model('tbl_amz_in_inventories', schema);
