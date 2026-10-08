// @ts-nocheck
const httpStatus = require('http-status');
const CronLogsModel = require('../models/cron-log.model');
const errorHandler = require('../utils/error.handler');

const getAllCrons = async (options = {}) => {
  try {
    const sort = {};

    if (options.sortBy) {
      const sortFields = options.sortBy.split(',');
      sortFields.forEach((field) => {
        const [key, order] = field.split(':');
        sort[key] = order === 'desc' ? -1 : 1;
      });
    }
    const docs = await CronLogsModel.find()
      .sort(sort)
      .select('_id title cron_time isRunning isExecuted startTime endTime');
    return {
      status: httpStatus.OK,
      message: 'Cron log found successfully.',
      data: docs,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'get-cron-log-list',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    };
  }
};

module.exports = {
  getAllCrons,
};
