const Joi = require('joi');
const { password } = require('./custom.validation');

const register = {
  body: Joi.object().keys({
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } }),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
  }),
};

const sendOtp = {
  body: Joi.object().keys({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
  }),
};

const verifyOtp = {
  body: Joi.object().keys({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    otp: Joi.string().length(6).required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

module.exports = {
  register,
  sendOtp,
  verifyOtp,
  logout,
  refreshTokens,
  verifyEmail,
};
