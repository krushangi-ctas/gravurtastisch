// @ts-nocheck
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const httpStatus = require('http-status');
const guideDocumentService = require('../services/guide-document.service');

const listPublishedTree = catchAsync(async (req, res) => {
  const isAdminSection = req.query?.isAdminSection;
  const result = await guideDocumentService.listPublishedTree(
    isAdminSection,
    req.user
  );
  res.status(result.status).send(result);
});

const getPublishedChildDetails = catchAsync(async (req, res) => {
  const result = await guideDocumentService.getPublishedChildDetails(
    req.params.childModuleId,
    req.user
  );
  res.status(result.status).send(result);
});

const listModulesTree = catchAsync(async (req, res) => {
  const query = pick(req.query, ['search', 'isAdminSection']);
  const result = await guideDocumentService.listModulesTree(query, req.user);
  res.status(result.status).send(result);
});

const listModules = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'status', 'isAdminSection']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await guideDocumentService.listModules(
    filter,
    options,
    req.user
  );
  res.status(result.status).send(result);
});

const getModuleById = catchAsync(async (req, res) => {
  const result = await guideDocumentService.getModuleById(
    req.params.moduleId,
    req.user
  );
  res.status(result.status).send(result);
});

const createModule = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const result = await guideDocumentService.createModule(
    req.body,
    userId,
    req.user
  );
  res.status(result.status).send(result);
});

const updateModule = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const result = await guideDocumentService.updateModule(
    req.params.moduleId,
    req.body,
    userId,
    req.user
  );
  res.status(result.status).send(result);
});

const deleteModule = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const result = await guideDocumentService.deleteModule(
    req.params.moduleId,
    userId,
    req.user
  );
  res.status(result.status).send(result);
});

const createStep = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const result = await guideDocumentService.createStep(
    req.params.moduleId,
    req.body,
    userId,
    req.user
  );
  res.status(result.status).send(result);
});

const updateStep = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const result = await guideDocumentService.updateStep(
    req.params.stepId,
    req.body,
    userId,
    req.user
  );
  res.status(result.status).send(result);
});

const deleteStep = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const result = await guideDocumentService.deleteStep(
    req.params.stepId,
    userId,
    req.user
  );
  res.status(result.status).send(result);
});

const reorderModuleSteps = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const result = await guideDocumentService.reorderModuleSteps(
    req.params.moduleId,
    req.body.steps,
    userId,
    req.user
  );
  res.status(result.status).send(result);
});

const reorderModules = catchAsync(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  const result = await guideDocumentService.reorderModules(
    req.body.parents,
    req.body.children,
    userId,
    req.user
  );
  res.status(result.status).send(result);
});

const uploadScreenshot = catchAsync(async (req, res) => {
  const file =
    (req.files && (req.files.screenshot || req.files.image || req.files.file)) ||
    req.file;
  if (!file) {
    return res.status(httpStatus.BAD_REQUEST).send({
      status: httpStatus.BAD_REQUEST,
      message: 'Screenshot file is required',
    });
  }

  const userId = req.user?._id || req.user?.id;
  const result = await guideDocumentService.saveUploadedScreenshot(file, userId);
  res.status(result.status).send(result);
});

module.exports = {
  listPublishedTree,
  getPublishedChildDetails,
  listModulesTree,
  listModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  createStep,
  updateStep,
  deleteStep,
  reorderModuleSteps,
  reorderModules,
  uploadScreenshot,
};
