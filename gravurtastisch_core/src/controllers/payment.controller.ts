const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const paymentService = require('../services/payment.service');

const createCheckout = catchAsync(async (req, res) => {
  const result = await paymentService.createCheckoutSession({
    planId: req.body.planId,
    email: req.body.email,
    name: req.body.name,
  });
  res.status(result.status).send(result);
});

const getSession = catchAsync(async (req, res) => {
  const result = await paymentService.getSessionStatus(req.params.sessionId);
  res.status(result.status).send(result);
});

/**
 * Stripe webhook — req.body must be the raw Buffer (see app.js).
 */
const stripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const result = await paymentService.handleWebhook(req.body, signature);
  res.status(httpStatus.OK).json(result);
});

module.exports = {
  createCheckout,
  getSession,
  stripeWebhook,
};
