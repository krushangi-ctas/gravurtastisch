const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');

const universalOtpApiKey = (req, res, next) => {
  const expectedKey = config.universalOtp && config.universalOtp.apiKey;
  if (!expectedKey) {
    return next(
      new ApiError(
        httpStatus.UNAUTHORIZED,
        'Universal OTP API key is not configured on server'
      )
    );
  }

  const providedKey =
    req.headers['x-api-key'] ||
    req.headers['X-Api-Key'] ||
    req.headers['x-universal-otp-key'] ||
    req.headers['X-Universal-Otp-Key'];

  if (!providedKey || providedKey !== expectedKey) {
    return next(
      new ApiError(httpStatus.UNAUTHORIZED, 'Invalid universal OTP API key')
    );
  }

  next();
};

module.exports = universalOtpApiKey;
