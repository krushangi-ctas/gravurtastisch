const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const fileListService = require('../../services/file-uploader/file-list.service');

const getFileList = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'status', 'filterQry']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const { status, message, resultData, pagination } =
    await fileListService.getFileList(filter, options);
  res.status(status).send({ status, message, resultData, pagination });
});

const getFileById = catchAsync(async (req, res) => {
  const {
    status,
    message,
    result: data,
  } = await fileListService.getFileById(req.params.id);
  res.status(status).send({ status, message, data });
});

module.exports = {
  getFileList,
  getFileById,
};
