// @ts-nocheck
const httpStatus = require('http-status');
const FileUploadModel = require('../../models/FileUploadModel');
const errorHandler = require('../../utils/error.handler');
const mongoose = require('mongoose');
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const getFileList = async (filter, options) => {
  try {
    let searchData = [{ status: { $ne: 2 } }];

    let sort = {};
    if (options.sortBy) {
      const [key, order] = options.sortBy.split(':');
      order === 'desc' ? (sort = { [key]: -1 }) : (sort = { [key]: 1 });
    }
    if (filter.status && filter.status !== 'undefined') {
      searchData.push({
        $or: [{ status: Number(filter.status) }],
      });
    }
    if (
      filter.filterQry &&
      filter.filterQry !== 'undefined' &&
      filter.filterQry !== 'null'
    ) {
      searchData.push({
        $or: [{ file_uploaded_status: filter.filterQry }],
      });
    }
    if (filter.search) {
      const escapedSearch = escapeRegExp(filter.search);
      const searchvalue = {
        $regex: '.*' + escapedSearch + '.*',
        $options: 'i',
      };

      searchData.push({
        $or: [
          { 'user.first_name': searchvalue },
          { file_origin_name: searchvalue },
          { file_records: { $eq: parseInt(filter.search) } },
          { file_type: searchvalue },
          { mime_type: searchvalue },
          { file_size: searchvalue },
          { processing_status: searchvalue },
          { file_uploaded_status: searchvalue },
        ],
      });
    }

    const limit =
      options.limit && parseInt(options.limit, 10) > 0
        ? parseInt(options.limit, 10)
        : 10;
    const page =
      options.page && parseInt(options.page, 10) > 0
        ? parseInt(options.page, 10)
        : 1;
    const skip = (page - 1) * limit;
    const countPromise = await FileUploadModel.aggregate([
      {
        $lookup: {
          from: 'tbl_users',
          localField: 'created_by',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $match: { $and: searchData } },
      { $count: 'count' },
    ]).exec();
    let docsPromise = FileUploadModel.aggregate([
      {
        $lookup: {
          from: 'tbl_users',
          localField: 'created_by',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $match: { $and: searchData } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          // uploaded_by_name: { $arrayElemAt: ['$user.first_name', 0] },
          uploaded_by_name: {
            $concat: [
              { $arrayElemAt: ['$user.first_name', 0] },
              ' ',
              { $arrayElemAt: ['$user.last_name', 0] },
            ],
          },
          file_origin_name: 1,
          file_records: 1,
          file_type: 1,
          mime_type: 1,
          file_size: 1,
          processing_status: 1,
          file_uploaded_status: 1,
          status: 1,
          createdAt: 1,
          can_download: 1,
          file_name: 1,
        },
      },
    ]);
    docsPromise = docsPromise.exec();
    const values = await Promise.all([countPromise, docsPromise]);
    const [totalCount, results] = values;
    const totalResults = totalCount[0] && totalCount[0].count;
    const totalPages = Math.ceil(totalResults / limit);
    const pagination = {
      length: totalResults,
      size: limit,
      page: page,
      lastPage: totalPages,
    };
    return {
      pagination,
      resultData: results,
      status: httpStatus.OK,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'get-file-list',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    };
  }
};

const getFileById = async (fileId) => {
  try {
    const file = await FileUploadModel.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(fileId) },
      },
      {
        $lookup: {
          from: 'tbl_users',
          localField: 'created_by',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          uploaded_by_name: {
            $concat: [
              { $arrayElemAt: ['$user.first_name', 0] },
              ' ',
              { $arrayElemAt: ['$user.last_name', 0] },
            ],
          },
          file_origin_name: 1,
          file_records: 1,
          file_type: 1,
          mime_type: 1,
          file_size: 1,
          processing_status: 1,
          file_uploaded_status: 1,
          status: 1,
          createdAt: 1,
          can_download: 1,
          file_name: 1,
        },
      },
    ]);

    if (!file.length) {
      return {
        status: httpStatus.NOT_FOUND,
        message: 'File not found',
      };
    }

    return {
      status: httpStatus.OK,
      result: file[0],
    };
  } catch (error) {
    errorHandler.errorM({ action_type: 'get-file-by-id', error_data: error });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    };
  }
};

module.exports = {
  getFileList,
  getFileById,
};
