// @ts-nocheck
const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON.plugin');

const websiteConfigurationSchema = new mongoose.Schema(
  {
    company: {
      name: {
        type: String,
        trim: true,

      },
      website: {
        type: String,
        trim: true,

      },
      tagline: {
        type: String,
        trim: true,

      },
      about: {
        type: String,
        trim: true,

      },
      copyright_text: {
        type: String,
        trim: true,

      },
    },
    contact: {
      email: {
        type: String,
        trim: true,
        lowercase: true,

      },
      phone: {
        type: String,
        trim: true,

      },
      address: {
        type: String,
        trim: true,

      },
      city: {
        type: String,
        trim: true,

      },
      state: {
        type: String,
        trim: true,

      },
      country: {
        type: String,
        trim: true,

      },
      postal_code: {
        type: String,
        trim: true,

      },
      working_hours: {
        type: String,
        trim: true,
      },
      timezone: {
        type: String,
        trim: true,
      },
    },
    social_links: {
      facebook: {
        type: String,
        trim: true,
        default: '',
      },
      instagram: {
        type: String,
        trim: true,
        default: '',
      },
      linkedin: {
        type: String,
        trim: true,
        default: '',
      },
      youtube: {
        type: String,
        trim: true,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

websiteConfigurationSchema.plugin(toJSON);

const WebsiteConfigurationModel = mongoose.model(
  'tbl_website_configuration',
  websiteConfigurationSchema
);

module.exports = WebsiteConfigurationModel;
