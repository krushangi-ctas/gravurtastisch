const express = require('express');
const auth = require('../../middlewares/auth');
const { requirePermission } = require('../../middlewares/permission');
const validate = require('../../middlewares/validate');
const supportValidation = require('../../validations/support.validation');
const supportController = require('../../controllers/support.controller');

const router = express.Router();

router
  .route('/')
  .post(
    validate(supportValidation.createSupportRequest),
    supportController.createSupportRequest
  )
  .get(
    auth(),
    requirePermission('support', 'view'),
    supportController.getAllSupportRequests
  );

router
  .route('/:requestId/status')
  .put(
    auth(),
    requirePermission('support', 'update'),
    validate(supportValidation.updateSupportRequestStatus),
    supportController.updateSupportRequestStatus
  );

module.exports = router;
