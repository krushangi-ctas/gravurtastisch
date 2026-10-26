const catchAsync = require('../utils/catchAsync');
const sectionService = require('../services/section.service');

const createSection = catchAsync(async (req, res) => {
  const result = await sectionService.createSection(req.user, req.body);
  res.status(result.status).send(result);
});

const listSections = catchAsync(async (req, res) => {
  const result = await sectionService.listSections(req.user, req.query);
  res.status(result.status).send(result);
});

const getSectionById = catchAsync(async (req, res) => {
  const result = await sectionService.getSectionById(req.user, req.params.sectionId);
  res.status(result.status).send(result);
});

const updateSection = catchAsync(async (req, res) => {
  const result = await sectionService.updateSection(
    req.user,
    req.params.sectionId,
    req.body
  );
  res.status(result.status).send(result);
});

const deleteSection = catchAsync(async (req, res) => {
  const result = await sectionService.deleteSection(
    req.user,
    req.params.sectionId
  );
  res.status(result.status).send(result);
});

const toggleStatus = catchAsync(async (req, res) => {
  const result = await sectionService.toggleStatus(
    req.user,
    req.params.sectionId,
    req.body.status
  );
  res.status(result.status).send(result);
});

module.exports = {
  createSection,
  listSections,
  getSectionById,
  updateSection,
  deleteSection,
  toggleStatus,
};
