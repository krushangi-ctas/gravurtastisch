const express = require('express');
const validate = require('../../middlewares/validate');
const paymentValidation = require('../../validations/payment.validation');
const paymentController = require('../../controllers/payment.controller');

const router = express.Router();

/**
 * Public: start Stripe Checkout for a plan.
 * POST /v1/payments/checkout
 */
router.post(
  '/checkout',
  validate(paymentValidation.createCheckout),
  paymentController.createCheckout
);

/**
 * Public: poll payment status after return from Stripe.
 * GET /v1/payments/session/:sessionId
 */
router.get(
  '/session/:sessionId',
  validate(paymentValidation.getSession),
  paymentController.getSession
);

/**
 * Public: handle cancelled Stripe Checkout and register seller as inactive.
 * POST /v1/payments/cancel
 */
router.post(
  '/cancel',
  validate(paymentValidation.cancelPayment),
  paymentController.cancelPayment
);

/**
 * Stripe webhook is mounted in app.js with express.raw (signature verification).
 * Kept here only as documentation — do not mount JSON-parsed webhook on this router.
 */

module.exports = router;
