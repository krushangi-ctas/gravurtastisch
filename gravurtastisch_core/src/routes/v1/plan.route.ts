const express = require('express');
const auth = require('../../middlewares/auth');
const { requirePermission } = require('../../middlewares/permission');
const validate = require('../../middlewares/validate');
const planValidation = require('../../validations/plan.validation');
const planController = require('../../controllers/plan.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    requirePermission('plans', 'create'),
    validate(planValidation.createPlan),
    planController.createPlan
  )
  .get(validate(planValidation.getPlans), planController.getPlans);

router
  .route('/:planId')
  .get(validate(planValidation.getPlan), planController.getPlan)
  .put(
    auth(),
    requirePermission('plans', 'update'),
    validate(planValidation.updatePlan),
    planController.updatePlan
  );

router
  .route('/:planId/status')
  .put(
    auth(),
    requirePermission('plans', 'update'),
    validate(planValidation.updatePlanStatus),
    planController.updateStatus
  );

module.exports = router;
