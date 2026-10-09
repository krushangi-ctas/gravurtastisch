const Joi = require('joi');

const getFileList = {
  query: Joi.object().keys({
    role: Joi.string(),
    sortBy: Joi.string(),
    status: Joi.allow(''),
    search: Joi.string().allow(''),
    filterQry: Joi.string().allow(''),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

module.exports = {
  getFileList,
};
