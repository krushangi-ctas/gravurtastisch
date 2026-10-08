const commonService = require('../services/common.service');
const catchAsync = require('../utils/catchAsync');
const EmailTemplatesModel = require('../models/email-templates.model');
const pick = require('../utils/pick');
const { customSlug } = require('../utils/helper');

const addEmailTemplate = catchAsync(async (req, res) => {
  let updateData = req.body;
  // const slug = customSlug(updateData.title);
  // updateData.template_trigger = slug;
  const { status, message, data } = await commonService.add(
    updateData,
    req.user._id,
    EmailTemplatesModel,
    'Email template already exists',
    'add-email-template'
  );
  res.status(status).send({ status, message, data });
});

const updateEmailTemplate = catchAsync(async (req, res) => {
  let updateData = req.body;
  if (updateData.title) {
    const newTemplateTrigger = customSlug(updateData.title);
    updateData.template_trigger = newTemplateTrigger;
  }
  const { status, message, data } = await commonService.updateById(
    req.params.emailTemplateId,
    req.params.userId,
    updateData,
    EmailTemplatesModel,
    'update-email-template',
    'delete-email-template',
    { key: ['title'], messageKey: 'Email-template' }
  );
  res.status(status).send({ status, message, data });
});

const getAllEmailTemplate = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const { status, message, data, pagination } = await commonService.getList(
    filter,
    options,
    EmailTemplatesModel,
    ['subject', 'content', 'status']
  );

  res.status(status).send({ status, message, data, pagination });
});

// const findEmailTemplateById = catchAsync(async (req, res) => {
//   const { status, message, data } = await commonService.getById(
//     req.params.emailTemplateId,
//     EmailTemplatesModel
//   );
//   res.status(status).send({ status, message, data });
// });

const getAllEmailTemplateList = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const queryParameters = {
    fields: {
      status: { $ne: 2 },
    },
    projection: {
      _id: 1,
      subject: 1,
      content: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    sort: {
      subject: 1,
    },
  };

  const { status, message, data } = await commonService.getAllList(
    options,
    queryParameters,
    EmailTemplatesModel
  );
  res.status(status).send({ status, message, data });
});

module.exports = {
  addEmailTemplate,
  updateEmailTemplate,
  getAllEmailTemplate,
  // findEmailTemplateById,
  getAllEmailTemplateList,
};
