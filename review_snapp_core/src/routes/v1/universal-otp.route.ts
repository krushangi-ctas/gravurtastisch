const express = require('express');
const validate = require('../../middlewares/validate');
const universalOtpApiKey = require('../../middlewares/universalOtpApiKey');
const universalOtpValidation = require('../../validations/universal-otp.validation');
const universalOtpController = require('../../controllers/universal-otp.controller');

const router = express.Router();

// Secure all universal-otp routes with API key guard
router.use(universalOtpApiKey);

router.post(
  '/generate/:system',
  validate(universalOtpValidation.generate),
  universalOtpController.generate
);

router.get(
  '/current/:system',
  validate(universalOtpValidation.current),
  universalOtpController.current
);

router.post(
  '/add',
  validate(universalOtpValidation.add),
  universalOtpController.add
);

router.get(
  '/get-by-id/:id',
  validate(universalOtpValidation.getById),
  universalOtpController.getById
);

router.get(
  '/get-by-system/:system',
  validate(universalOtpValidation.getBySystem),
  universalOtpController.getBySystem
);

router.put(
  '/update/:id',
  validate(universalOtpValidation.update),
  universalOtpController.update
);

router.put(
  '/delete/:id',
  validate(universalOtpValidation.deleteById),
  universalOtpController.deleteById
);

router.get(
  '/list',
  validate(universalOtpValidation.list),
  universalOtpController.list
);

module.exports = router;
