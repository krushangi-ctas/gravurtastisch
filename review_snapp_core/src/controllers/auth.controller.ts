const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const tokenService = require('../services/token.service');
const emailService = require('../services/email.service');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const sendOtp = catchAsync(async (req, res) => {
  const { message, status } = await authService.sendOtp(req.body);
  res.status(status).send({ status, message });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { message, status, user, tokens } = await authService.verifyOtp(
    req.body
  );
  if (user && tokens && status === 200) {
    return res.status(status).send({ user, tokens, status, message });
  }
  return res.status(status).send({ status, message });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const changePassword = catchAsync(async (req, res) => {
  const { status, message } = await authService.changePassword(
    req.body.userId,
    req.body.password,
    req.body.oldpassword
  );
  return res.status(status).send({ status, message });
});

const refreshTokens = catchAsync(async (req, res) => {
  const { message, status, tokens, user } = await authService.refreshAuth(
    req.body.refreshToken
  );
  if (tokens && status === 200) {
    return res.status(status).send({ tokens, status, user });
  } else {
    return res.status(status).send({ status, message });
  }
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(
    req.user
  );
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  sendOtp,
  verifyOtp,
  logout,
  refreshTokens,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
};
