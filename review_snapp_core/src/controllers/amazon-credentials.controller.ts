const amazonCredentialsService = require('../services/amazon-credentials.service');
const catchAsync = require('../utils/catchAsync');
const { resolveSellerOwnerId } = require('../services/permission.service');

const getAmazonCredentialsByUserId = catchAsync(async (req, res) => {
  const ownerId = resolveSellerOwnerId(req.user);
  const { status, message, data } =
    await amazonCredentialsService.getAmazonCredentialsByUserId(ownerId);
  res.status(status).send({ status, message, data });
});

const getAmazonCredentialsById = catchAsync(async (req, res) => {
  const { status, message, data } =
    await amazonCredentialsService.getAmazonCredentialsById(
      req.params.credentialsId
    );
  res.status(status).send({ status, message, data });
});

const upsertAmazonCredentials = catchAsync(async (req, res) => {
  const ownerId = resolveSellerOwnerId(req.user);
  const { status, message, data } =
    await amazonCredentialsService.upsertAmazonCredentials(req.body, ownerId);
  res.status(status).send({ status, message, data });
});

module.exports = {
  getAmazonCredentialsById,
  upsertAmazonCredentials,
  getAmazonCredentialsByUserId,
};
