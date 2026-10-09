const catchAsync = require('../utils/catchAsync');
const systemLogService = require('../services/system-log.service');
const pick = require('../utils/pick');

const getSystemLogByDate = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'search',
    'status',
    'startDate',
    'endDate',
    'operation_by',
    'operation',
  ]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await systemLogService.getSystemLogByDate(filter, options);

  res.status(result.status).send(result);
});

const getSystemLogOperationList = catchAsync(async (req, res) => {
  const { status, message, data } =
    await systemLogService.getSystemLogOperationList();
  res.status(status).send({ status, message, data });
});

const getSystemLogById = catchAsync(async (req, res) => {
  const { status, message, data } = await systemLogService.getSystemLogById(
    req.params.id,
    req.params.key,
    req.params.operation,
    req.params.type
  );
  res.status(status).send({ status, message, resultData: data });
});

const generateExportSystemLogReportForAdmin = catchAsync(async (req, res) => {
  const filter = pick(req.body, [
    'search',
    'status',
    'startDate',
    'endDate',
    'operation_by',
    'operation',
  ]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const { status, message, data, pagination } =
    await systemLogService.generateExportSystemLogReportForAdmin(
      filter,
      options,
      req.params.userId
    );
  res.status(status).send({ status, message, data, pagination });
});

module.exports = {
  getSystemLogByDate,
  getSystemLogOperationList,
  getSystemLogById,
  generateExportSystemLogReportForAdmin,
};
