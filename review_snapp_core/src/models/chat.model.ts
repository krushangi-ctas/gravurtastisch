// @ts-nocheck
/**
 * Legacy placeholder for optional chat aggregates in user.service.
 */
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {},
  { strict: false, timestamps: true, collection: 'tbl_chats' }
);

module.exports = mongoose.models.tbl_chats || mongoose.model('tbl_chats', chatSchema);
