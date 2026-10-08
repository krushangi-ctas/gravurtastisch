const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');
const paginate = require('./plugins/paginate.plugin');

/**
 * Stripe payment / subscription acknowledgements.
 * Webhook updates are authoritative — survives closed browser tabs.
 */
const paymentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tbl_plans',
      required: true,
      index: true,
    },
    planName: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true,
    },
    mode: {
      type: String,
      enum: ['subscription', 'payment'],
      default: 'subscription',
    },
    status: {
      // pending → awaiting Stripe; paid → webhook confirmed; failed / canceled / refunded
      type: String,
      enum: ['pending', 'paid', 'failed', 'canceled', 'refunded'],
      default: 'pending',
      index: true,
    },
    stripeSessionId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    stripeCustomerId: {
      type: String,
      trim: true,
      default: null,
      index: true,
      sparse: true,
    },
    stripeSubscriptionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
      default: null,
    },
    stripeInvoiceId: {
      type: String,
      trim: true,
      default: null,
    },
    /** Stripe event ids already processed (idempotency) */
    processedEventIds: {
      type: [String],
      default: [],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tbl_users',
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

paymentSchema.plugin(toJSON);
paymentSchema.plugin(paginate);

const PaymentModel = mongoose.model('tbl_payments', paymentSchema);

module.exports = PaymentModel;
