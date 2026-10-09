const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');

const router = express.Router();

router.post(
  '/register',
  validate(authValidation.register),
  authController.register
);
router.post(
  '/send-otp',
  validate(authValidation.sendOtp),
  authController.sendOtp
);
router.post(
  '/verify-otp',
  validate(authValidation.verifyOtp),
  authController.verifyOtp
);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post(
  '/refresh-tokens',
  validate(authValidation.refreshTokens),
  authController.refreshTokens
);
router.post('/change-password', authController.changePassword);
router.post(
  '/send-verification-email',
  auth(),
  authController.sendVerificationEmail
);
router.post(
  '/verify-email',
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

module.exports = router;
