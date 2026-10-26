const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { requirePermission } = require('../../middlewares/permission');
const sectionValidation = require('../../validations/section.validation');
const sectionController = require('../../controllers/section.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    requirePermission('sections', 'create'),
    validate(sectionValidation.createSection),
    sectionController.createSection
  )
  .get(
    auth(),
    requirePermission('sections', 'view'),
    validate(sectionValidation.listSections),
    sectionController.listSections
  );

router
  .route('/:sectionId')
  .get(
    auth(),
    requirePermission('sections', 'view'),
    validate(sectionValidation.getSectionById),
    sectionController.getSectionById
  )
  .put(
    auth(),
    requirePermission('sections', 'update'),
    validate(sectionValidation.updateSection),
    sectionController.updateSection
  )
  .delete(
    auth(),
    requirePermission('sections', 'delete'),
    validate(sectionValidation.deleteSection),
    sectionController.deleteSection
  );

router.patch(
  '/:sectionId/status',
  auth(),
  requirePermission('sections', 'update'),
  validate(sectionValidation.toggleStatus),
  sectionController.toggleStatus
);

module.exports = router;
