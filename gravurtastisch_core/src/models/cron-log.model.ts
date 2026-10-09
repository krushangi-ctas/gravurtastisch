// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

const cronLogsSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  cron_time: {
    type: String,
    trim: true,
  },
  isRunning: {
    type: Boolean,
    default: true,
  },
  isExecuted: {
    type: Boolean,
    default: true,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
});

cronLogsSchema.plugin(toJSON);
cronLogsSchema.plugin(paginate);

const cronLogsModel = mongoose.model('tbl_cron_logs', cronLogsSchema);

module.exports = cronLogsModel;
