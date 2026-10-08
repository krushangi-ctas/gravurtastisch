const router = require('express').Router();
const auth = require('../../middlewares/auth');
const cronLogController = require('../../controllers/cron-log.controller');

router.get('/get-list', auth(), cronLogController.getAllCrons);

module.exports = router;
