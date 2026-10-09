// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const ipSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Number,
      default: 1, // 0 - INACTIVE, 1 - ACTIVE, 2 - DELETE
    },
  },
  { timestamps: true }
);

ipSchema.plugin(toJSON);
ipSchema.plugin(paginate);

const ipModel = mongoose.model('tbl_blocked_ips', ipSchema);

module.exports = ipModel;
