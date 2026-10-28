const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const cleanMessage = (message || '').replace(/["\\]/g, '');

  const response = {
    code: statusCode,
    message: cleanMessage,
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  // Record unhandled errors in tbl_cron_errors with proper scope
  try {
    const errorLogHandler = require('../utils/error.handler');
    const rawUrl = String(req.originalUrl || req.url || '').toLowerCase();
    const action = `${req.method || 'GET'} ${req.baseUrl || ''}${req.path || ''}`;
    let detectedScope = 'admin';
    if (rawUrl.includes('/seller') || req.user?.userType === 'seller' || req.user?.isSellerAdmin) {
      detectedScope = 'seller';
    }
    if (rawUrl.includes('/payment') || rawUrl.includes('/checkout')) {
      detectedScope = 'admin';
    }

    errorLogHandler.errorM({
      action_type: action.trim(),
      error_data: err,
      scope: detectedScope,
      operation_by: req.user?._id || req.userId || null,
      ip_address: req.ip || req.headers['x-forwarded-for'],
    });
  } catch (logErr) {
    // avoid throwing from error middleware
  }

  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
