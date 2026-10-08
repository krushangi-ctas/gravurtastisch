const websiteConfigurationService = require('../services/website-configuration.service');
const catchAsync = require('../utils/catchAsync');

const getWebsiteConfiguration = catchAsync(async (req, res) => {
  const result = await websiteConfigurationService.getWebsiteConfiguration();
  return res.status(result.status).json({
    status: result.status === 200,
    message: result.message,
    data: result.data,
  });
});

const updateWebsiteConfiguration = catchAsync(async (req, res) => {
  const updateData = req.body;
  const result =
    await websiteConfigurationService.updateWebsiteConfiguration(updateData);
  return res.status(result.status).json({
    status: result.status === 200,
    message: result.message,
    data: result.data,
  });
});

module.exports = {
  getWebsiteConfiguration,
  updateWebsiteConfiguration,
};
