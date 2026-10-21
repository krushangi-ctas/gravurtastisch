// @ts-nocheck
const mongoose = require('mongoose');
const paginate = require('./plugins/paginate.plugin');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId },
    amazonOrderId: { type: String, unique: true, trim: true },
    buyerEmail: { type: String, trim: true },
    orderStatus: { type: String, trim: true },
    fulfillmentChannel: { type: String, trim: true },
    shipServiceLevel: { type: String, trim: true },
    marketplaceId: { type: String, trim: true },
    purchaseDate: Date,
    shippingAddress: {
      postalCode: { type: String, trim: true },
      city: { type: String, trim: true },
      countryCode: { type: String, trim: true },
      addressLine1: { type: String, trim: true },
      addressLine2: { type: String, trim: true },
    },
    orderTotal: {
      currencyCode: { type: String, trim: true },
      amount: Number,
    },
    earliestDeliveryDate: Date,
    latestDeliveryDate: Date,
    shipmentServiceLevelCategory: { type: String, trim: true },
    isBusinessOrder: Boolean,
    salesChannel: { type: String, trim: true },
    processedBy: { type: String, enum: ['CRON'], trim: true },
    orderItems: [
      {
        orderItemId: { type: String, trim: true },
        ASIN: { type: String, trim: true },
        sellerSKU: { type: String, trim: true },
        title: { type: String, trim: true },
        quantityShipped: Number,
        isGift: Boolean,
        itemPrice: {
          currencyCode: { type: String, trim: true },
          amount: Number,
        },
        promotionDiscount: {
          currencyCode: { type: String, trim: true },
          amount: Number,
        },
        promotionDiscountTax: {
          currencyCode: { type: String, trim: true },
          amount: Number,
        },
        conditionId: { type: String, trim: true },
        conditionSubtypeId: { type: String, trim: true },
        isTransparency: Boolean,
        quantityOrdered: Number,
        productInfo: {
          type: Object,
        },
      },
    ],
    isSent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
    isNeedToSend: {
      type: Boolean,
      default: false,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

/**
 * @typedef order
 */
orderSchema.plugin(paginate);
const ordermodel = mongoose.model('tbl_orders', orderSchema);

module.exports = ordermodel;
