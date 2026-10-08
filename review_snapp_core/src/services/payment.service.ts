const httpStatus = require('http-status');
const Stripe = require('stripe');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const PaymentModel = require('../models/payment.model');
const PlanModel = require('../models/plan.model');
const User = require('../models/user.model');
const emailService = require('./email.service');

const getStripe = () => {
  if (!config.stripe.secretKey) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Stripe is not configured. Set STRIPE_SECRET_KEY in the API .env.'
    );
  }
  return new Stripe(config.stripe.secretKey);
};

/**
 * Create a Stripe Checkout Session for a plan and persist a pending payment row.
 */
const createCheckoutSession = async ({ planId, email, name }) => {
  const plan = await PlanModel.findById(planId);
  if (!plan || plan.status !== 1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Plan not found or inactive.');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const displayName = (name || '').trim();
  const amountCents = Math.round(Number(plan.price) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Plan price must be at least $0.50 for Stripe Checkout.'
    );
  }

  const existingUser = await User.findOne({ email: normalizedEmail, status: { $ne: 2 } });

  const payment = await PaymentModel.create({
    email: normalizedEmail,
    name: displayName,
    planId: plan._id,
    planName: plan.name,
    amount: Number(plan.price),
    currency: 'usd',
    mode: 'subscription',
    status: 'pending',
    userId: existingUser ? existingUser._id : null,
  });

  const frontend = (config.stripe.frontendUrl || config.site_url || 'http://localhost:8080').replace(
    /\/$/,
    ''
  );
  const successUrl =
    config.stripe.successUrl ||
    `${frontend}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    config.stripe.cancelUrl || `${frontend}/payment/cancel?plan=${plan._id}`;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: normalizedEmail,
    client_reference_id: String(payment._id),
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      paymentId: String(payment._id),
      planId: String(plan._id),
      planName: plan.name,
      email: normalizedEmail,
    },
    subscription_data: {
      metadata: {
        paymentId: String(payment._id),
        planId: String(plan._id),
        email: normalizedEmail,
      },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          recurring: { interval: 'month' },
          product_data: {
            name: `Gravurtastisch — ${plan.name}`,
            description: `${plan.request_quota || 0} units/mo · ${plan.marketplace || 0} channels`,
            metadata: {
              planId: String(plan._id),
            },
          },
        },
      },
    ],
  });

  payment.stripeSessionId = session.id;
  payment.metadata = {
    ...(payment.metadata || {}),
    checkoutUrl: session.url,
  };
  await payment.save();

  return {
    status: httpStatus.OK,
    message: 'Checkout session created.',
    data: {
      sessionId: session.id,
      url: session.url,
      paymentId: payment._id,
    },
  };
};

const getSessionStatus = async (sessionId) => {
  if (!sessionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'sessionId is required.');
  }

  const payment = await PaymentModel.findOne({ stripeSessionId: sessionId }).lean();
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found for this session.');
  }

  // Optionally refresh from Stripe if still pending
  if (payment.status === 'pending' && config.stripe.secretKey) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid' || session.status === 'complete') {
        await markPaymentPaid(payment._id, {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          stripePaymentIntentId: session.payment_intent,
          eventId: `session-poll:${sessionId}`,
        });
        const refreshed = await PaymentModel.findById(payment._id).lean();
        return {
          status: httpStatus.OK,
          message: 'Payment status retrieved.',
          data: refreshed,
        };
      }
    } catch (err) {
      logger.warn(`Stripe session poll failed: ${err.message}`);
    }
  }

  return {
    status: httpStatus.OK,
    message: 'Payment status retrieved.',
    data: payment,
  };
};

const markPaymentPaid = async (paymentId: any, extras: any = {}) => {
  const payment = await PaymentModel.findById(paymentId);
  if (!payment) return null;

  if (extras.eventId && payment.processedEventIds.includes(extras.eventId)) {
    return payment;
  }

  const wasPaid = payment.status === 'paid';

  payment.status = 'paid';
  payment.paidAt = payment.paidAt || new Date();
  if (extras.stripeCustomerId) payment.stripeCustomerId = extras.stripeCustomerId;
  if (extras.stripeSubscriptionId) payment.stripeSubscriptionId = extras.stripeSubscriptionId;
  if (extras.stripePaymentIntentId) {
    payment.stripePaymentIntentId = extras.stripePaymentIntentId;
  }
  if (extras.stripeInvoiceId) payment.stripeInvoiceId = extras.stripeInvoiceId;
  if (extras.eventId) {
    payment.processedEventIds = [...(payment.processedEventIds || []), extras.eventId];
  }
  await payment.save();

  // Apply plan limits to matching user account if one exists
  const plan = await PlanModel.findById(payment.planId);
  const user =
    (payment.userId && (await User.findById(payment.userId))) ||
    (await User.findOne({ email: payment.email, status: { $ne: 2 } }));

  if (user && plan) {
    user.planLimits = {
      maxMarketplaces: Number(plan.marketplace) || user.planLimits?.maxMarketplaces || 5,
      maxReviewRequestsPerMonth:
        Number(plan.request_quota) || user.planLimits?.maxReviewRequestsPerMonth || 1000,
    };
    if (extras.stripeCustomerId) user.stripeCustomerId = extras.stripeCustomerId;
    if (extras.stripeSubscriptionId) {
      user.stripeSubscriptionId = extras.stripeSubscriptionId;
    }
    user.currentPlanId = plan._id;
    user.subscriptionStatus = 'active';
    await user.save();
    payment.userId = user._id;
    await payment.save();
  }

  if (!wasPaid) {
    await notifyPaymentPaid(payment, plan).catch((err) =>
      logger.warn(`Payment notification failed: ${err.message}`)
    );
  }

  return payment;
};

const notifyPaymentPaid = async (payment, plan) => {
  const adminTo = config.email.adminEmail || config.email.from;
  if (!adminTo) return;

  const subject = `Payment received — ${payment.planName || plan?.name || 'Plan'}`;
  const html = `
    <h2>Stripe payment confirmed</h2>
    <p><strong>Email:</strong> ${payment.email}</p>
    <p><strong>Name:</strong> ${payment.name || '—'}</p>
    <p><strong>Plan:</strong> ${payment.planName || plan?.name || payment.planId}</p>
    <p><strong>Amount:</strong> $${Number(payment.amount).toFixed(2)} ${String(
      payment.currency || 'usd'
    ).toUpperCase()}/mo</p>
    <p><strong>Session:</strong> ${payment.stripeSessionId || '—'}</p>
    <p><strong>Subscription:</strong> ${payment.stripeSubscriptionId || '—'}</p>
    <p>Recorded via webhook — browser close does not affect this acknowledgement.</p>
  `;
  await emailService.sendEmail(adminTo, subject, subject, html);
};

/**
 * Verify Stripe signature and process payment lifecycle events.
 */
const handleWebhook = async (rawBody, signature) => {
  if (!config.stripe.webhookSecret) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Stripe webhook secret is not configured (STRIPE_WEBHOOK_SECRET).'
    );
  }
  if (!signature) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing Stripe-Signature header.');
  }

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe.webhookSecret
    );
  } catch (err) {
    logger.error(`Stripe webhook signature failed: ${err.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, `Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId || session.client_reference_id;
      let payment = paymentId ? await PaymentModel.findById(paymentId) : null;
      if (!payment && session.id) {
        payment = await PaymentModel.findOne({ stripeSessionId: session.id });
      }
      if (payment) {
        await markPaymentPaid(payment._id, {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          stripePaymentIntentId: session.payment_intent,
          eventId: event.id,
        });
      } else {
        logger.warn(`checkout.session.completed with no matching payment: ${session.id}`);
      }
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        const payment = await PaymentModel.findOne({ stripeSubscriptionId: subId }).sort({
          createdAt: -1,
        });
        if (payment) {
          await markPaymentPaid(payment._id, {
            stripeCustomerId: invoice.customer,
            stripeSubscriptionId: subId,
            stripeInvoiceId: invoice.id,
            stripePaymentIntentId: invoice.payment_intent,
            eventId: event.id,
          });
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const payment = await PaymentModel.findOne({ stripeSubscriptionId: sub.id });
      if (payment && !payment.processedEventIds.includes(event.id)) {
        payment.status = 'canceled';
        payment.processedEventIds = [...(payment.processedEventIds || []), event.id];
        await payment.save();
        if (payment.userId) {
          await User.findByIdAndUpdate(payment.userId, {
            subscriptionStatus: 'canceled',
          });
        }
      }
      break;
    }
    case 'checkout.session.expired': {
      const session = event.data.object;
      const payment = await PaymentModel.findOne({ stripeSessionId: session.id });
      if (payment && payment.status === 'pending' && !payment.processedEventIds.includes(event.id)) {
        payment.status = 'canceled';
        payment.processedEventIds = [...(payment.processedEventIds || []), event.id];
        await payment.save();
      }
      break;
    }
    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }

  return { received: true, type: event.type };
};

module.exports = {
  createCheckoutSession,
  getSessionStatus,
  handleWebhook,
  markPaymentPaid,
};
