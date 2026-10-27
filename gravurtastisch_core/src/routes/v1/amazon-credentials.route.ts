const router = require('express').Router();
const auth = require('../../middlewares/auth');
const { requirePermission } = require('../../middlewares/permission');
const amazonCredentialsController = require('../../controllers/amazon-credentials.controller');

// Get Amazon credentials by userID
router.get(
  '/',
  auth(),
  requirePermission('amazon-credentials', 'view'),
  amazonCredentialsController.getAmazonCredentialsByUserId
);

// Get Amazon credentials by ID
router.get(
  '/:credentialsId',
  auth(),
  requirePermission('amazon-credentials', 'view'),
  amazonCredentialsController.getAmazonCredentialsById
);

// Create or update Amazon credentials
router.post(
  '/upsert',
  auth(),
  requirePermission('amazon-credentials', 'update'),
  amazonCredentialsController.upsertAmazonCredentials
);

module.exports = router;
