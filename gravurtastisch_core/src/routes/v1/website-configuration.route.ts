const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const websiteConfigurationValidation = require('../../validations/website-configuration.validation');
const websiteConfigurationController = require('../../controllers/website-configuration.controller');

const router = express.Router();

router
  .route('/')
  .get(websiteConfigurationController.getWebsiteConfiguration)
  .put(
    auth(),
    validate(websiteConfigurationValidation.updateWebsiteConfiguration),
    websiteConfigurationController.updateWebsiteConfiguration
  );

module.exports = router;
