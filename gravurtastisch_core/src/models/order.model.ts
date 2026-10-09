// @ts-nocheck
const mongoose = require('mongoose');
const paginate = require('./plugins/paginate.plugin');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId },
    amazonOrderId: { type: String, unique: true },
    buyerEmail: String,
    orderStatus: String,
    fulfillmentChannel: String,
    shipServiceLevel: String,
    marketplaceId: String,
    purchaseDate: Date,
    shippingAddress: {
      postalCode: String,
      city: String,
      countryCode: String,
      addressLine1: String,
      addressLine2: String,
    },
    orderTotal: {
      currencyCode: String,
      amount: Number,
    },
    earliestDeliveryDate: Date,
    latestDeliveryDate: Date,
    shipmentServiceLevelCategory: String,
    isBusinessOrder: Boolean,
    salesChannel: String,
    processedBy: { type: String, enum: ['CRON'] },
    orderItems: [
      {
        orderItemId: String,
        ASIN: String,
        sellerSKU: String,
        title: String,
        quantityShipped: Number,
        isGift: Boolean,
        itemPrice: {
          currencyCode: String,
          amount: Number,
        },
        promotionDiscount: {
          currencyCode: String,
          amount: Number,
        },
        promotionDiscountTax: {
          currencyCode: String,
          amount: Number,
        },
        conditionId: String,
        conditionSubtypeId: String,
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
