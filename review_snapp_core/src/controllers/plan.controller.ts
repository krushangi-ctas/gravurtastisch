const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const planService = require('../services/plan.service');

const createPlan = catchAsync(async (req, res) => {
  const result = await planService.createPlan(
    req.body,
    req.user ? req.user._id : null
  );
  res.status(result.status).send(result);
});

const updatePlan = catchAsync(async (req, res) => {
  const result = await planService.updatePlan(
    req.params.planId,
    req.body,
    req.user ? req.user._id : null
  );
  res.status(result.status).send(result);
});

const getPlans = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await planService.getPlans(filter, options);
  res.status(result.status).send(result);
});

const getPlan = catchAsync(async (req, res) => {
  const result = await planService.getPlanById(req.params.planId);
  res.status(result.status).send(result);
});

const updateStatus = catchAsync(async (req, res) => {
  const result = await planService.updatePlanStatus(
    req.params.planId,
    req.body.status,
    req.user ? req.user._id : null
  );
  res.status(result.status).send(result);
});

module.exports = {
  createPlan,
  updatePlan,
  getPlans,
  getPlan,
  updateStatus,
};
