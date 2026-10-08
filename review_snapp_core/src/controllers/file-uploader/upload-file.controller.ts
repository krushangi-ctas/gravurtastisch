const catchAsync = require('../../utils/catchAsync');
const uploadFileService = require('../../services/file-uploader/upload-file.service');

const importSheet = catchAsync(async (req, res) => {
  const { status, message } = await uploadFileService.importSheet(
    req.body,
    req.files.file,
    req.query.type
  );
  return res.status(status).send({ status, message });
});

const verifyFile = catchAsync(async (req, res) => {
  const { status, message } = await uploadFileService.verifyFile(
    req.body,
    req.query.type
  );
  return res.status(status).send({ status, message });
});

const importTrackingSheet = catchAsync(async (req, res) => {
  const { status, message } = await uploadFileService.importTrackingSheet(
    req.files.file,
    req.params.userId,
    req.body
  );
  return res.status(status).send({ status, message });
});

module.exports = {
  importSheet,
  verifyFile,
  importTrackingSheet,
};
