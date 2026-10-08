// @ts-nocheck
const mongoose = require('mongoose');

const systemLogsSchema = new mongoose.Schema(
  {
    operation: {
      type: String,
      trim: true,
    },
    operation_by: {
      type: mongoose.Types.ObjectId,
    },
    key: {
      type: String,
      trim: true,
    },
    operation_data: {
      type: Array,
    },
    ip_address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const systemLogsModel = mongoose.model('tbl_system_logs', systemLogsSchema);

module.exports = systemLogsModel;
