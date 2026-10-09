const router = require('express').Router();
const auth = require('../../middlewares/auth');
const systemLogController = require('../../controllers/system-log.controller');
const validate = require('../../middlewares/validate');
const systemLogValidation = require('../../validations/system-log.validation');

router.get(
  '/get-system-log',
  auth(),
  validate(systemLogValidation.getSystemLogByDate),
  systemLogController.getSystemLogByDate
);

/* get list of operation field from system log table */
router.get(
  '/get-all-operation-list',
  auth(),
  systemLogController.getSystemLogOperationList
);

router.get(
  '/get-by-id/:id/:key/:operation/:type',
  auth(),
  systemLogController.getSystemLogById
);

router.post(
  '/export-system-log-report/:userId',
  auth(),
  systemLogController.generateExportSystemLogReportForAdmin
);

module.exports = router;
