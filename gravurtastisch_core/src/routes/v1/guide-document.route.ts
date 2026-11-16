// @ts-nocheck
const express = require('express');
const fs = require('fs');
const path = require('path');
const multipart = require('connect-multiparty');
const auth = require('../../middlewares/auth');
const requirePermission = require('../../middlewares/permission');
const validate = require('../../middlewares/validate');
const guideDocumentValidation = require('../../validations/guide-document.validation');
const guideDocumentController = require('../../controllers/guide-document.controller');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads/guide-documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multipartMiddleware = multipart({ uploadDir });

// Optional auth for published tree (extracts user if token provided, but accessible publicly or to sellers)
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return auth()(req, res, next);
  }
  next();
};

// --- Published Tree Routes (Viewer) ---
router.get(
  '/published-tree',
  optionalAuth,
  validate(guideDocumentValidation.publishedTree),
  guideDocumentController.listPublishedTree
);

router.get(
  '/published-tree/child/:childModuleId',
  optionalAuth,
  validate(guideDocumentValidation.publishedChild),
  guideDocumentController.getPublishedChildDetails
);

// Compatibility with saas endpoints if loginId was in path
router.get(
  '/published-tree/:loginId',
  optionalAuth,
  validate(guideDocumentValidation.publishedTree),
  guideDocumentController.listPublishedTree
);

router.get(
  '/published-tree/:loginId/child/:childModuleId',
  optionalAuth,
  validate(guideDocumentValidation.publishedChild),
  guideDocumentController.getPublishedChildDetails
);

// --- Modules Management Tree ---
router.get(
  '/modules-tree',
  auth(),
  requirePermission('guide-document', 'view'),
  guideDocumentController.listModulesTree
);

router.get(
  '/modules-tree/:loginId',
  auth(),
  requirePermission('guide-document', 'view'),
  guideDocumentController.listModulesTree
);

// --- Modules Reorder ---
router.put(
  '/modules/reorder',
  auth(),
  requirePermission('guide-document', 'update'),
  validate(guideDocumentValidation.reorderModules),
  guideDocumentController.reorderModules
);

router.put(
  '/modules/:loginId/reorder',
  auth(),
  requirePermission('guide-document', 'update'),
  validate(guideDocumentValidation.reorderModules),
  guideDocumentController.reorderModules
);

// --- Upload Screenshot ---
router.post(
  '/upload-screenshot',
  auth(),
  requirePermission('guide-document', 'create'),
  multipartMiddleware,
  guideDocumentController.uploadScreenshot
);

router.post(
  '/upload-screenshot/:loginId',
  auth(),
  requirePermission('guide-document', 'create'),
  multipartMiddleware,
  guideDocumentController.uploadScreenshot
);

// --- Steps Management ---
router.post(
  '/modules/:moduleId/steps',
  auth(),
  requirePermission('guide-document', 'create'),
  validate(guideDocumentValidation.createStep),
  guideDocumentController.createStep
);

router.post(
  '/modules/:loginId/:moduleId/steps',
  auth(),
  requirePermission('guide-document', 'create'),
  validate(guideDocumentValidation.createStep),
  guideDocumentController.createStep
);

router.put(
  '/modules/:moduleId/steps/reorder',
  auth(),
  requirePermission('guide-document', 'update'),
  validate(guideDocumentValidation.reorderSteps),
  guideDocumentController.reorderModuleSteps
);

router.put(
  '/modules/:loginId/:moduleId/steps/reorder',
  auth(),
  requirePermission('guide-document', 'update'),
  validate(guideDocumentValidation.reorderSteps),
  guideDocumentController.reorderModuleSteps
);

router.route('/steps/:stepId')
  .put(
    auth(),
    requirePermission('guide-document', 'update'),
    validate(guideDocumentValidation.updateStep),
    guideDocumentController.updateStep
  )
  .patch(
    auth(),
    requirePermission('guide-document', 'update'),
    validate(guideDocumentValidation.updateStep),
    guideDocumentController.updateStep
  )
  .delete(
    auth(),
    requirePermission('guide-document', 'delete'),
    validate(guideDocumentValidation.deleteStep),
    guideDocumentController.deleteStep
  );

router.route('/steps/:loginId/:stepId')
  .put(
    auth(),
    requirePermission('guide-document', 'update'),
    validate(guideDocumentValidation.updateStep),
    guideDocumentController.updateStep
  )
  .patch(
    auth(),
    requirePermission('guide-document', 'update'),
    validate(guideDocumentValidation.updateStep),
    guideDocumentController.updateStep
  )
  .delete(
    auth(),
    requirePermission('guide-document', 'delete'),
    validate(guideDocumentValidation.deleteStep),
    guideDocumentController.deleteStep
  );

// --- Modules CRUD ---
router.route('/modules')
  .get(
    auth(),
    requirePermission('guide-document', 'view'),
    validate(guideDocumentValidation.getModules),
    guideDocumentController.listModules
  )
  .post(
    auth(),
    requirePermission('guide-document', 'create'),
    validate(guideDocumentValidation.createModule),
    guideDocumentController.createModule
  );

router.route('/modules/:loginId')
  .get(
    auth(),
    requirePermission('guide-document', 'view'),
    validate(guideDocumentValidation.getModules),
    guideDocumentController.listModules
  )
  .post(
    auth(),
    requirePermission('guide-document', 'create'),
    validate(guideDocumentValidation.createModule),
    guideDocumentController.createModule
  );

router.route('/modules/:moduleId')
  .get(
    auth(),
    requirePermission('guide-document', 'view'),
    validate(guideDocumentValidation.getModuleById),
    guideDocumentController.getModuleById
  )
  .put(
    auth(),
    requirePermission('guide-document', 'update'),
    validate(guideDocumentValidation.updateModule),
    guideDocumentController.updateModule
  )
  .patch(
    auth(),
    requirePermission('guide-document', 'update'),
    validate(guideDocumentValidation.updateModule),
    guideDocumentController.updateModule
  )
  .delete(
    auth(),
    requirePermission('guide-document', 'delete'),
    validate(guideDocumentValidation.deleteModule),
    guideDocumentController.deleteModule
  );

router.route('/modules/:loginId/:moduleId')
  .get(
    auth(),
    requirePermission('guide-document', 'view'),
    validate(guideDocumentValidation.getModuleById),
    guideDocumentController.getModuleById
  )
  .put(
    auth(),
    requirePermission('guide-document', 'update'),
    validate(guideDocumentValidation.updateModule),
    guideDocumentController.updateModule
  )
  .patch(
    auth(),
    requirePermission('guide-document', 'update'),
    validate(guideDocumentValidation.updateModule),
    guideDocumentController.updateModule
  )
  .delete(
    auth(),
    requirePermission('guide-document', 'delete'),
    validate(guideDocumentValidation.deleteModule),
    guideDocumentController.deleteModule
  );

module.exports = router;
