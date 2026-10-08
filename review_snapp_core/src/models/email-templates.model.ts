// @ts-nocheck
const mongoose = require('mongoose');
const paginate = require('./plugins/paginate.plugin');

const emailTemplatesSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Number,
      required: true,
      enum: [0, 1, 2], // 0 = Inactive, 1 = Active, 2 = Deleted
      default: 1, // Default status is Active
    },
  },
  {
    timestamps: true,
  }
);

emailTemplatesSchema.plugin(paginate);

const EmailTemplatesModel = mongoose.model(
  'tbl_email_templates',
  emailTemplatesSchema
);

module.exports = EmailTemplatesModel;
