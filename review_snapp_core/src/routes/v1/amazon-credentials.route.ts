const router = require('express').Router();
const auth = require('../../middlewares/auth');
const amazonCredentialsController = require('../../controllers/amazon-credentials.controller');

// Get Amazon credentials by userID
router.get(
  '/',
  auth(),
  amazonCredentialsController.getAmazonCredentialsByUserId
);

// Get Amazon credentials by ID
router.get(
  '/:credentialsId',
  auth(),
  amazonCredentialsController.getAmazonCredentialsById
);

// Create or update Amazon credentials
router.post(
  '/upsert',
  auth(),
  amazonCredentialsController.upsertAmazonCredentials
);

module.exports = router;
