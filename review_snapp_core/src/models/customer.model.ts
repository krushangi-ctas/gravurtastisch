// @ts-nocheck
/**
 * Legacy placeholder — Customer collection was referenced from passport
 * but never shipped in the models barrel. Kept so JWT verify can no-op safely.
 */
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true, collection: 'tbl_customers' }
);

module.exports =
  mongoose.models.tbl_customers || mongoose.model('tbl_customers', customerSchema);
