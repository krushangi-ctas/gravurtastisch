const router = require('express').Router();
const auth = require('../../middlewares/auth');
const emailTemplateController = require('../../controllers/email-template.controller');
const validate = require('../../middlewares/validate');
const emailTemplateValidation = require('../../validations/email-template.validation');

router.post(
  '/add-email-template',
  auth(),
  validate(emailTemplateValidation.addEmailTemplate),
  emailTemplateController.addEmailTemplate
);

router.put(
  '/update-email-template/:emailTemplateId/:userId',
  auth(),
  validate(emailTemplateValidation.updateEmailTemplate),
  emailTemplateController.updateEmailTemplate
);

router.get(
  '/get-email-templates',
  auth(),
  validate(emailTemplateValidation.getAllEmailTemplate),
  emailTemplateController.getAllEmailTemplate
);

router.get(
  '/get-subject-content-list',
  auth(),
  emailTemplateController.getAllEmailTemplateList
);

// router.get(
//   '/get-by-id/:emailTemplateId/:userId',
//   auth(),
//   validate(emailTemplateValidation.findEmailTemplateById),
//   emailTemplateController.findEmailTemplateById
// );

module.exports = router;
