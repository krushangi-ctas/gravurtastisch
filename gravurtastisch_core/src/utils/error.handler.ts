// @ts-nocheck
const ErrorModel = require('../models/cron-error.model');

module.exports.errorM = function (arg) {
  const error = new ErrorModel();
  error.action_type = arg.action_type;
  error.error_data = JSON.stringify(arg.error_data);
  error.save(() => {});
};
