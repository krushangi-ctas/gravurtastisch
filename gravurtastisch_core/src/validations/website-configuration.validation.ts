const Joi = require('joi');

const updateWebsiteConfiguration = {
  body: Joi.object().keys({
    company: Joi.object().keys({
      name: Joi.string().allow('', null),
      website: Joi.string().allow('', null),
      tagline: Joi.string().allow('', null),
      about: Joi.string().allow('', null),
      copyright_text: Joi.string().allow('', null),
    }),
    contact: Joi.object().keys({
      email: Joi.string().allow('', null),
      phone: Joi.string().allow('', null),
      address: Joi.string().allow('', null),
      city: Joi.string().allow('', null),
      state: Joi.string().allow('', null),
      country: Joi.string().allow('', null),
      postal_code: Joi.string().allow('', null),
      working_hours: Joi.string().allow('', null),
      timezone: Joi.string().allow('', null),
    }),
    social_links: Joi.object().keys({
      facebook: Joi.string().allow('', null),
      instagram: Joi.string().allow('', null),
      linkedin: Joi.string().allow('', null),
      youtube: Joi.string().allow('', null),
    }),
  }),
};

module.exports = {
  updateWebsiteConfiguration,
};
