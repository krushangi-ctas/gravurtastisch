// routes/marketplaceRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const generalSettingController = require('../../controllers/generalSetting.controller');

router.put(
  '/update-setting',
  auth(),
  generalSettingController.updateGeneralSetting
);

router.get('/', auth(), generalSettingController.getGeneralSetting);

module.exports = router;
