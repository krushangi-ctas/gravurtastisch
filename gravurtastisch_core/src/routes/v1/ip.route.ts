const router = require('express').Router();
const auth = require('../../middlewares/auth');
const ipController = require('../../controllers/ip.controller');

router.post('/add/:userId', auth(), ipController.addIp);

router.get('/get-list', auth(), ipController.getIpList);

router.get('/get-by-id/:id/:userId', auth(), ipController.getIpById);

router.put('/update-by-id/:id/:userId', auth(), ipController.updateIpById);

module.exports = router;
