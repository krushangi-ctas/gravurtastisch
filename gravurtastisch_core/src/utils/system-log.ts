// @ts-nocheck
const SystemLogsModel = require('../models/system-logs.model');
var ip = require('ip');
/**
 *
 * @param {'UPDATE'|'DELETE'|'CREATE'|'LOGIN'} operationType
 * @param {Object<any>} data
 * @param {string} userId
 * @param {string} key
 * @param {Object<any>} oldData
 */
const systemLog = async (operationType, data, userId, key, oldData = {}) => {
  const operationData = {
    operation: operationType,
    operation_by: userId,
    key: key,
    ip_address: ip.address(),
  };
  operationData.operation_data = data;
  delete operationData.operation_data.operation_by;

  if (operationType === 'UPDATE') {
    const updatedFields = extractUpdatedFields(oldData, data);
    operationData.operation_data = {
      oldData: {
        _id: oldData._id,
        ...updatedFields,
      },
      updatedData: extractUpdatedFields(data, oldData),
    };
  }

  await SystemLogsModel.create(operationData);
};
const extractUpdatedFields = (oldData, updatedData) => {
  const updatedFields = {};

  for (const key in updatedData) {
    if (oldData[key] !== updatedData[key]) {
      updatedFields[key] = oldData[key];
    }
  }
  return updatedFields;
};

module.exports = {
  systemLog,
};
