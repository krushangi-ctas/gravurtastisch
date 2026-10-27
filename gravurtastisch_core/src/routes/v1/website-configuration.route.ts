const express = require('express');
const auth = require('../../middlewares/auth');
const { requirePermission } = require('../../middlewares/permission');
const validate = require('../../middlewares/validate');
const websiteConfigurationValidation = require('../../validations/website-configuration.validation');
const websiteConfigurationController = require('../../controllers/website-configuration.controller');

const router = express.Router();

router
  .route('/')
  .get(websiteConfigurationController.getWebsiteConfiguration)
  .put(
    auth(),
    requirePermission('site-configuration', 'update'),
    validate(websiteConfigurationValidation.updateWebsiteConfiguration),
    websiteConfigurationController.updateWebsiteConfiguration
  );

module.exports = router;
