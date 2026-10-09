const cronLogService = require('../services/cron-log.service');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

const getAllCrons = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy']);
  const { status, message, data } = await cronLogService.getAllCrons(options);
  res.status(status).send({ status, message, data });
});

module.exports = { getAllCrons };
