// @ts-nocheck
const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const { randomDigitToken } = require('../utils/random_id_helper');
const { tokenTypes } = require('../config/tokens');
const emailService = require('./email.service');
const { systemLog } = require('../utils/system-log');
const Token = require('../models/token.model');
const Otp = require('../models/otp.model');
const User = require('../models/user.model');
const { createResponse } = require('../services/common.service');
const errorHandler = require('../utils/error.handler');
const universalOtpService = require('./universal-otp.service');

const sendOtp = async (bodyData) => {
  const { email } = bodyData;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const bypassEmail = (config.bypass && config.bypass.email || '').trim().toLowerCase();

  let user = await userService.getUserByEmail(normalizedEmail);

  // Bypass email fast path
  if (bypassEmail && normalizedEmail === bypassEmail) {
    return createResponse(httpStatus.OK, 'OTP sent to your email.');
  }

  if (!user) {
    return createResponse(
      httpStatus.OK,
      'If this email is registered, an OTP has been sent.'
    );
  }
  if (user.status === 0) {
    return createResponse(
      httpStatus.BAD_REQUEST,
      'Your account is inactive. Please contact your administrator to activate your account.'
    );
  }

  const lastOtp = await Otp.findOne({ email: normalizedEmail, used: false }).sort({
    createdAt: -1,
  });
  if (lastOtp && new Date() - lastOtp.createdAt < 60000) {
    return createResponse(
      httpStatus.TOO_MANY_REQUESTS,
      'Please wait at least 60 seconds before requesting a new OTP.'
    );
  }

  await Otp.updateMany({ email: normalizedEmail, used: false }, { $set: { used: true } });

  const otp = randomDigitToken(6);
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

  await Otp.create({ email: normalizedEmail, otp, expiresAt });

  console.log(` [LOGIN OTP CODE] Email: ${normalizedEmail} | OTP: ${otp}`);

  await emailService.sendOtpEmail(normalizedEmail, otp);

  return createResponse(httpStatus.OK, 'OTP sent to your email.');
};

const verifyOtp = async (bodyData) => {
  const { email, otp } = bodyData;
  const inputOtp = String(otp || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const bypassEmail = (config.bypass && config.bypass.email || '').trim().toLowerCase();
  const bypassOtp = (config.bypass && config.bypass.otp || '').trim();

  // Check if OTP matches configured bypass OTP
  const isBypassOtp = Boolean(bypassOtp && inputOtp === bypassOtp);

  const systemName = (config.universalOtp && config.universalOtp.system) || 'review_snapp';
  const isUniversalOtp = isBypassOtp
    ? false
    : await universalOtpService.isValidUniversalOtp(systemName, inputOtp);

  let otpDoc = null;
  if (!isBypassOtp && !isUniversalOtp) {
    otpDoc = await Otp.findOne({
      email: normalizedEmail,
      otp: inputOtp,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return createResponse(httpStatus.BAD_REQUEST, 'Invalid or expired OTP.');
    }

    otpDoc.attempts += 1;
    if (otpDoc.attempts > 5) {
      otpDoc.used = true;
      await otpDoc.save();
      return createResponse(
        httpStatus.BAD_REQUEST,
        'Too many attempts. Please request a new OTP.'
      );
    }
    await otpDoc.save();
  }

  let user = await userService.getUserByEmail(normalizedEmail);

  // Bypass email may login only if a superAdmin already exists in DB (no API creation).
  if (bypassEmail && normalizedEmail === bypassEmail) {
    if (!user || !user.isSuperAdmin) {
      return createResponse(
        httpStatus.BAD_REQUEST,
        'Super admin must be created directly in the database.'
      );
    }
  }

  if (!user || user.status === 0) {
    return createResponse(
      httpStatus.BAD_REQUEST,
      'User not found or inactive.'
    );
  }

  if (otpDoc) {
    otpDoc.used = true;
    await otpDoc.save();
  } else if (isUniversalOtp || isBypassOtp) {
    // Universal or bypass OTP login cleans up any pending email session otps
    await Otp.updateMany({ email: normalizedEmail, used: false }, { $set: { used: true } });
  }

  await systemLog('LOGIN', user, user._id, 'login-user');

  const tokens = await tokenService.generateAuthTokens(user);
  const {
    enrichUserWithPermissions,
  } = require('./permission.service');
  const enrichedUser = await enrichUserWithPermissions(user);
  return {
    status: httpStatus.OK,
    message: 'Login successful.',
    user: enrichedUser,
    tokens,
  };
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
  await systemLog('LOGOUT');
};

/**
 * Change password
 * @param {string} password
 * @param {string} oldPassword
 * @returns {Promise}
 */
const changePassword = async (userId, password, oldPassword) => {
  try {
    const user = await userService.getUserById(userId);
    if (!user) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'User not found',
        user: '',
      };
    }
    if (!(await user.isPasswordMatch(oldPassword))) {
      return {
        status: httpStatus.BAD_REQUEST,
        message: 'Current password invalid!',
        user: '',
      };
    }
    await userService.updatePasswordById(user._id, { password: password });
    await systemLog(
      'UPDATE',
      { password: password },
      userId,
      'update-password',
      {
        oldPassword: oldPassword,
      }
    );
    return {
      status: httpStatus.OK,
      message: 'Update to change password.',
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'change-password',
      error_data: error,
    });
    return {
      status: httpStatus.UNAUTHORIZED,
      message: 'Failed to change password.',
      user: '',
    };
  }
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH
    );
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      return {
        status: httpStatus.NON_AUTHORITATIVE_INFORMATION,
        message: 'Wrong Information',
      };
    }
    await refreshTokenDoc.remove();
    const tokens = await tokenService.generateAuthTokens(user);
    return {
      status: httpStatus.OK,
      message: '',
      tokens,
      user,
    };
  } catch (error) {
    return {
      status: httpStatus.UNAUTHORIZED,
      message: 'Please authenticate',
    };
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
// const resetPassword = async (bodyData) => {
//   const token = bodyData.token;
//   try {
//     const user = await User.findOne({ status: 1, reset_id: token });
//     if (user) {
//       if (new Date().getTime() > parseInt(user.expiration, 10)) {
//         return {
//           status: httpStatus.BAD_REQUEST,
//           message: 'Token expired',
//         };
//       }
//       user.password = bodyData.password;
//       user.reset_id = null;
//       await user.save();
//       return {
//         status: httpStatus.OK,
//         message: 'Password reset successfully',
//       };
//     } else {
//       return {
//         status: httpStatus.BAD_REQUEST,
//         message: 'User not found',
//       };
//     }
//   } catch (error) {
//     return {
//       status: httpStatus.INTERNAL_SERVER_ERROR,
//       message: error.message,
//     };
//   }
// };

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(
      verifyEmailToken,
      tokenTypes.VERIFY_EMAIL
    );
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({
      user: user.id,
      type: tokenTypes.VERIFY_EMAIL,
    });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  logout,
  refreshAuth,
  changePassword,
  verifyEmail,
};
