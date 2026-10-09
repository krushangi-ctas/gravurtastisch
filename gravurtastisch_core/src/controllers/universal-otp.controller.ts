const catchAsync = require('../utils/catchAsync');
const universalOtpService = require('../services/universal-otp.service');

const generate = catchAsync(async (req, res) => {
  const system = req.params.system;
  const generatedBy = req.body?.generatedBy || 'manual';
  const result = await universalOtpService.generate(system, generatedBy);
  res.status(result.status).send(result);
});

const current = catchAsync(async (req, res) => {
  const system = req.params.system;
  const result = await universalOtpService.getCurrent(system);
  res.status(result.status).send(result);
});

const add = catchAsync(async (req, res) => {
  const result = await universalOtpService.add(req.body);
  res.status(result.status).send(result);
});

const getById = catchAsync(async (req, res) => {
  const result = await universalOtpService.getById(req.params.id);
  res.status(result.status).send(result);
});

const getBySystem = catchAsync(async (req, res) => {
  const result = await universalOtpService.getBySystem(req.params.system);
  res.status(result.status).send(result);
});

const update = catchAsync(async (req, res) => {
  const result = await universalOtpService.update(req.params.id, req.body);
  res.status(result.status).send(result);
});

const deleteById = catchAsync(async (req, res) => {
  const result = await universalOtpService.deleteById(req.params.id);
  res.status(result.status).send(result);
});

const list = catchAsync(async (req, res) => {
  const result = await universalOtpService.list(req.query);
  res.status(result.status).send(result);
});

module.exports = {
  generate,
  current,
  add,
  getById,
  getBySystem,
  update,
  deleteById,
  list,
};
