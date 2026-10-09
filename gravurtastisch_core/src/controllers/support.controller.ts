const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const SupportRequestModel = require('../models/support-request.model');
const emailService = require('../services/email.service');
const config = require('../config/config');

const createSupportRequest = catchAsync(async (req, res) => {
  const { name, email, message } = req.body;
  const supportRequest = await SupportRequestModel.create({
    name,
    email,
    message,
    status: 'pending',
  });

  // Return immediate response to the client
  res.status(httpStatus.CREATED).send({
    status: httpStatus.CREATED,
    message: 'Support request created successfully',
    data: supportRequest,
  });

  // Asynchronous background notification email (does not block HTTP response)
  if (config.email.adminEmail) {
    (async () => {
      try {
        const content = `
          <h2 style="color: #613EA3; margin: 0 0 16px;">New Support Request</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Name</td></tr>
            <tr><td style="padding:0 0 12px; color:#1E1035; font-size:15px;">${name}</td></tr>
            <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Email</td></tr>
            <tr><td style="padding:0 0 12px; color:#1E1035; font-size:15px;"><a href="mailto:${email}" style="color:#613EA3; text-decoration:none;">${email}</a></td></tr>
            <tr><td style="padding:8px 0; color:#555; font-size:14px; font-weight:600;">Message</td></tr>
            <tr><td style="padding:0 0 12px; color:#1E1035; font-size:15px; line-height:1.6;">${message}</td></tr>
          </table>
          <hr style="border:none; border-top:1px solid #e0e0e0; margin:20px 0;" />
          <p style="color:#888; font-size:13px;">This request was submitted via the contact form on the website.</p>
        `;
        const htmlBody = await emailService.getMailBody(
          content,
          'New support request received'
        );
        await emailService.sendEmail(
          config.email.adminEmail,
          `New Support Request — ${name}`,
          '',
          htmlBody
        );
      } catch (err) {
        console.error('Failed to send support request notification email:', err);
      }
    })();
  }
});

const getAllSupportRequests = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (!options.limit) options.limit = 20;
  if (!options.page) options.page = 1;
  if (!options.sortBy) options.sortBy = 'createdAt:desc';

  const result = await SupportRequestModel.paginate(filter, options, [
    'name',
    'email',
    'message',
  ]);
  res.status(httpStatus.OK).json({
    data: result.results,
    pagination: result.pagination,
  });
});

const updateSupportRequestStatus = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  const updatedRequest = await SupportRequestModel.findByIdAndUpdate(
    requestId,
    { $set: { status } },
    { new: true }
  );

  if (!updatedRequest) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: 'Support request not found',
    });
  }

  res.status(httpStatus.OK).send({
    status: httpStatus.OK,
    message: 'Support request updated successfully',
    data: updatedRequest,
  });
});

module.exports = {
  createSupportRequest,
  getAllSupportRequests,
  updateSupportRequestStatus,
};
