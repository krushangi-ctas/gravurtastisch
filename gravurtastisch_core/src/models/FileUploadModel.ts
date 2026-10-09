// @ts-nocheck
const mongoose = require('mongoose');
const schema = new mongoose.Schema({}, { strict: false, timestamps: true, collection: 'tbl_file_uploads' });
module.exports = mongoose.models.tbl_file_uploads || mongoose.model('tbl_file_uploads', schema);
