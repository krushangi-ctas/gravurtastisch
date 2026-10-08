// @ts-nocheck
const httpStatus = require('http-status');
const SystemLogsModel = require('../models/system-logs.model');
const errorHandler = require('../utils/error.handler');
const mongoose = require('mongoose');
const { paginationOprator } = require('../models/plugins/common-pagination');
const { getFormattedTimestamp } = require('../config/constants');
const { createObjectCsvWriter } = require('csv-writer');
const db = mongoose.connection;
const fs = require('fs');
const path = require('path');

function getStartAndEndDate(filter) {
  const currentDate = new Date();
  const startDate = filter.startDate
    ? new Date(new Date(filter.startDate)) //.setUTCHours(0, 0, 0, 1))
    : new Date(currentDate.setUTCHours(0, 0, 0, 1));
  const endDate = filter.endDate
    ? new Date(new Date(filter.endDate)) //.setUTCHours(23, 59, 59, 999))
    : new Date(currentDate.setUTCHours(23, 59, 59, 999));
  return { startDate, endDate };
}

const userLookupStage = {
  $lookup: {
    from: 'tbl_users',
    localField: 'operation_by',
    foreignField: '_id',
    as: 'userDetails',
  },
};

const roleLookupStage = {
  $lookup: {
    from: 'tbl_roles',
    localField: 'userDetails.role_id',
    foreignField: '_id',
    as: 'role',
  },
};

const getSystemLogByDate = async (filter, options) => {
  try {
    // SEARCH
    let searchData = {};
    if (filter.search) {
      const searchvalue = {
        $regex: '.*' + filter.search + '.*',
        $options: 'i',
      };
      searchData.$or = [
        { operation: searchvalue },
        { key: searchvalue },
        { ip_address: searchvalue },
        { 'userDetails.first_name': searchvalue },
        { 'userDetails.last_name': searchvalue },
        { 'role.role_name': searchvalue },
        { 'role.role_name': 'Super Admin' },
      ];
    }
    if (filter.operation_by) {
      searchData.operation_by = mongoose.Types.ObjectId(filter.operation_by);
    }
    if (filter.operation) {
      searchData.operation = filter.operation;
    }

    const { startDate, endDate } = getStartAndEndDate(filter);
    searchData.createdAt = { $gte: startDate, $lte: endDate };

    const { limit, page, skip, sort } = paginationOprator(options);
    const countPromise = SystemLogsModel.aggregate([
      userLookupStage,
      roleLookupStage,
      { $match: searchData },
      { $count: 'count' },
    ]);

    const docsPromise = SystemLogsModel.aggregate([
      userLookupStage,
      roleLookupStage,
      { $match: searchData },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          operation: 1,
          operation_by: 1,
          key: 1,
          ip_address: 1,
          first_name: { $arrayElemAt: ['$userDetails.first_name', 0] },
          last_name: { $arrayElemAt: ['$userDetails.last_name', 0] },
          role_name: {
            $ifNull: [{ $arrayElemAt: ['$role.role_name', 0] }, 'Super Admin'],
          },
          operation_data: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalCount, results] = values;
      const totalResults = totalCount.length > 0 ? totalCount[0].count : 0;
      const totalPages = totalResults > 0 ? Math.ceil(totalResults / limit) : 1;

      const pagination = {
        length: totalResults,
        size: limit,
        page,
        lastPage: totalPages,
      };

      return {
        status: httpStatus.OK,
        message: 'System logs retrieved successfully',
        data: results,
        pagination,
      };
    });
  } catch (error) {
    errorHandler.errorM({
      action_type: 'get-system-log-list',
      error_data: error,
    });

    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    };
  }
};

const getSystemLogOperationList = async () => {
  try {
    const data = await SystemLogsModel.aggregate([
      {
        $group: {
          _id: '$operation',
          operation: {
            $first: '$operation',
          },
        },
      },
    ]);
    return {
      status: httpStatus.OK,
      message: 'Success',
      data: data,
    };
  } catch (error) {
    errorHandler.errorM({
      action_type: 'get-operation-list',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    };
  }
};

const getSystemLogById = async (id, key, operation, type) => {
  const transactionArray = [
    'Add-transaction-details',
    'create-transaction',
    'delete-transaction',
    'update-transaction',
    'create-new-shipment-rate',
    'create-new-shipment',
    'delete-shipment',
    'create-new-LOB',
    'create-new-PON',
    'create-new-Branch',
    'create-new-default-code',
    'create-new-mode',
    'delete-mode',
    'added-multiple-banned-ASIN',
    'update-banned-ASIN',
    'update-LOB',
    'update-PON',
    'delete-PON',
    'update-shipment-rate',
    'update-single-mode',
    'update-shipment',
    'update-single-branch',
    'added-multiple-banned-ASIN-from-file',
    'update-HSN',
    'update-default-code',
    'delete-default-code',
    'delete-LOB',
    'delete-ordering-group',
    'delete-branch',
    'update-profile-image',
    'add-store-detail',
    'create-new-HSN',
    'update-SKUs',
    'update-ip',
    'CREATE-GROUP',
    'update-banned-brand',
    'update-banned-keyword',
    'add-multiple-banned-keywords',
    'delete-shipment-rate',
    'delete-user',
    'update-user',
    'added-multiple-banned-brands-from-file',
    'added-multiple-banned-keyword-from-file',
    'create-user',
    'delete-loaded-asin',
    'add-banned-brand',
    // "delete-banned-brand",
    'delete-banned-keyword',
    'update-supplier',
  ];
  const backOrderData = [
    'add-backorder-to-seller',
    'delete-seller-backorder',
    'update-seller-backorder',
  ];
  const orderData = [
    'delete-return-order',
    'update-return-order',
    'add-return-order',
    'add-order',
    'add-extra-product-in-bag',
  ];
  const tranckingData = ['add-tracking-details'];
  const countryData = [
    'create-import-hsn-category',
    'delete-import-hsn-category',
    'update-import-hsn-category',
  ];

  const CompanyData = [
    'add-company',
    'update-company',
    'delete-company',
    'update-marketPlace',
    'add-marketPlace',
    'delete-marketPlace',
    'delete-child-wareHouse',
    'update-child-wareHouse',
    'add-child-warehouse',
    'add-warehouse',
    'update-wareHouse',
    'delete-wareHouse',
    'update-store-detail',
    'delete-store-detail',
  ];

  const roleData = ['create-role', 'update-role'];

  const loginData = ['login-user'];

  const getLookupStage = (from, localField, as) => {
    // Define the let block based on the operation condition
    let letBlock;
    if (operation === 'UPDATE') {
      const value = type === '1' ? 'oldData' : 'updatedData';
      letBlock = {
        ids: `$operation_data.${value}.${localField}`,
      };
    } else {
      letBlock = {
        ids: `$operation_data.${localField}`,
      };
    }

    return {
      $lookup: {
        from,
        let: letBlock,
        pipeline: [
          {
            $match: {
              $expr: {
                $in: [
                  '$_id',
                  {
                    $map: {
                      input: '$$ids',
                      as: 'id',
                      in: { $toObjectId: '$$id' },
                    },
                  },
                ],
              },
            },
          },
        ],
        as,
      },
    };
  };

  function commonPipeline(localField, foreignField, as) {
    return {
      [localField]: {
        $cond: {
          if: {
            $in: [
              {
                $toObjectId: {
                  $arrayElemAt: [`$operation_data.${localField}`, 0],
                },
              },
              `$${as}._id`,
            ],
          },
          then: {
            $arrayElemAt: [`$${as}.${foreignField}`, 0],
          },
          else: `$$data.${localField}`,
        },
      },
    };
  }

  function pipeline(data, localField, foreignField, as) {
    return {
      [localField]: {
        $cond: {
          if: {
            $in: [
              {
                $toObjectId: {
                  $arrayElemAt: [`$operation_data.${data}.${localField}`, 0],
                },
              },
              `$${as}._id`,
            ],
          },
          then: { $arrayElemAt: [`$${as}.${foreignField}`, 0] },
          else: '',
        },
      },
    };
  }

  try {
    const userLookupStage = {
      $lookup: {
        from: 'tbl_users',
        localField: 'operation_by',
        foreignField: '_id',
        as: 'userDetails',
      },
    };

    const roleLookupStage = {
      $lookup: {
        from: 'tbl_roles',
        localField: 'userDetails.role_id',
        foreignField: '_id',
        as: 'role',
      },
    };

    let pipelineStages = [
      { $match: { _id: mongoose.Types.ObjectId(id) } },
      userLookupStage,
      roleLookupStage,
    ];

    const getLookupStagesByKey = (key) => {
      switch (key) {
        case 'Add-transaction-details':
        case 'update-transaction':
        case 'delete-transaction':
        case 'create-new-shipment-rate':
        case 'create-new-shipment':
        case 'create-new-LOB':
        case 'delete-LOB':
        case 'create-new-PON':
        case 'delete-PON':
        case 'create-new-Branch':
        case 'create-new-default-code':
        case 'update-default-code':
        case 'delete-default-code':
        case 'create-new-mode':
        case 'delete-mode':
        case 'added-multiple-banned-ASIN':
        case 'update-banned-ASIN':
        case 'update-LOB':
        case 'update-PON':
        case 'update-shipment-rate':
        case 'update-single-mode':
        case 'update-shipment':
        case 'delete-shipment':
        case 'update-single-branch':
        case 'added-multiple-banned-ASIN-from-file':
        case 'update-HSN':
        case 'create-new-HSN':
        case 'delete-ordering-group':
        case 'delete-branch':
        case 'update-profile-image':
        case 'add-store-detail':
        case 'update-SKUs':
        case 'update-ip':
        case 'CREATE-GROUP':
        case 'update-banned-brand':
        case 'update-banned-keyword':
        case 'delete-shipment-rate':
        case 'add-multiple-banned-keywords':
        case 'update-user':
        case 'delete-user':
        case 'added-multiple-banned-brands-from-file':
        case 'added-multiple-banned-keyword-from-file':
        case 'create-user':
        case 'delete-loaded-asin':
        case 'delete-banned-keyword':
        case 'add-banned-brand':
          return [
            getLookupStage('tbl_store_details', 'store_id', 'stores'),
            getLookupStage('tbl_users', 'created_by', 'users'),
            getLookupStage('tbl_users', 'user_id', 'users2'),
            getLookupStage('tbl_users', 'createdBy', 'users1'),
            getLookupStage('tbl_users', 'updated_by', 'userData'),
            getLookupStage('tbl_users', 'updatedBy', 'userData1'),
            // getLookupStage("tbl_companies", "company_id", "companies"),
            // getLookupStage("tbl_countries", "country_id", "countries"),
            //getLookupStage("tbl_warehouses", "warehouse_id", "warehouses"),
            getLookupStage('tbl_roles', 'role_id', 'roles'),
            getLookupStage(
              'tbl_auto_ordering_groups',
              'group_id',
              'autoOrderingGroups'
            ),
            // Additional lookups for update-store-detail
            getLookupStage(
              'tbl_auto_ordering_purchase_accounts',
              'purchase_account_id',
              'purchaseAccounts'
            ),
            getLookupStage(
              'tbl_shiprocket_accounts',
              'shiprocket_account_id',
              'shiprocketAccounts'
            ),
          ];

        case 'update-seller-backorder':
        case 'add-backorder-to-seller':
        case 'delete-seller-backorder':
          return [
            getLookupStage('tbl_auto_comments', 'auto_comment', 'autoComment'),
            getLookupStage('tbl_order_statuses', 'order_status', 'orderStatus'),
            getLookupStage(
              'tbl_order_statuses',
              'no_any_activities',
              'orderStatuses'
            ),
            getLookupStage('tbl_users', 'bucket_name', 'users'),
          ];

        case 'create-import-hsn-category':
        case 'delete-import-hsn-category':
        case 'update-import-hsn-category':
          return [getLookupStage('tbl_countries', 'country_id', 'country')];
        case 'create-demo-crud':
        case 'delete-demo-crud':
        case 'update-demo-crud':
          return [getLookupStage('tbl_store_details', 'account_id', 'stores')];
        case 'add-tracking-details':
          return [getLookupStage('tbl_couriers', 'courier_id', 'couriers')];
        case 'delete-return-order':
        case 'update-return-order':
        case 'add-order':
        case 'add-extra-product-in-bag':
        case 'add-return-order':
          return [
            getLookupStage('tbl_couriers', 'courier_id', 'couriers'),
            getLookupStage(
              'tbl_order_statuses',
              'order_status',
              'orderStatuses'
            ),
            getLookupStage('tbl_store_details', 'store_id', 'stores'),
            getLookupStage('tbl_users', 'safety_claim_by', 'users'),
            getLookupStage('tbl_users', 'validated_by', 'validatedUsers'),
          ];

        case 'update-supplier':
        case 'add-company':
        case 'update-company':
        case 'delete-company':
        case 'update-marketPlace':
        case 'add-marketPlace':
        case 'delete-marketPlace':
        case 'delete-child-wareHouse':
        case 'update-child-wareHouse':
        case 'add-child-warehouse':
        case 'add-warehouse':
        case 'update-wareHouse':
        case 'delete-wareHouse':
        case 'update-store-detail':
        case 'delete-store-detail':
          return [
            getLookupStage('tbl_companies', 'company_id', 'companies'),
            getLookupStage('tbl_countries', 'country_id', 'countries'),
            getLookupStage('tbl_warehouses', 'warehouse_id', 'warehouses'),
            getLookupStage(
              'tbl_marketplaces',
              'marketplace_id',
              'marketplaces'
            ),
            getLookupStage(
              'tbl_auto_ordering_purchase_accounts',
              'purchase_account_id',
              'purchaseAccounts'
            ),
            getLookupStage(
              'tbl_shiprocket_accounts',
              'shiprocket_account_id',
              'shiprocketAccounts'
            ),
          ];

        case 'create-role':
        case 'update-role':
          return [getLookupStage('tbl_roles', 'role_id', 'roleDetails')];

        case 'login-user':
          return [getLookupStage('tbl_roles', 'role_id', 'roles')];
        default:
          return [];
      }
    };

    const mapUpdateDataTransformation = (data) => ({
      $mergeObjects: [
        { $arrayElemAt: [`$operation_data.${data}`, 0] },
        {
          $switch: {
            branches: [
              {
                case: { $in: ['$key', transactionArray] },
                then: {
                  ...pipeline(data, 'store_id', 'store_name', 'stores'),
                  // ...pipeline(data, "company_id", "name", "companies"),
                  // ...pipeline(data, "country_id", "country_name", "countries"),
                  // ...pipeline(data, "warehouse_id", "name", "warehouses"),
                  ...pipeline(data, 'role_id', 'role_name', 'roles'),
                  ...pipeline(
                    data,
                    'group_id',
                    'group_name',
                    'autoOrderingGroups'
                  ),
                  created_by: {
                    $cond: {
                      if: {
                        $in: [
                          {
                            $toObjectId: {
                              $arrayElemAt: [
                                `$operation_data.${data}.created_by`,
                                0,
                              ],
                            },
                          },
                          '$users._id',
                        ],
                      },
                      then: {
                        $concat: [
                          { $arrayElemAt: ['$users.first_name', 0] },
                          ' ',
                          { $arrayElemAt: ['$users.last_name', 0] },
                        ],
                      },
                      else: '',
                    },
                  },
                  createdBy: {
                    $cond: {
                      if: {
                        $in: [
                          {
                            $toObjectId: {
                              $arrayElemAt: [
                                `$operation_data.${data}.createdBy`,
                                0,
                              ],
                            },
                          },
                          '$users1._id',
                        ],
                      },
                      then: {
                        $concat: [
                          { $arrayElemAt: ['$users1.first_name', 0] },
                          ' ',
                          { $arrayElemAt: ['$users1.last_name', 0] },
                        ],
                      },
                      else: '',
                    },
                  },
                  updated_by: {
                    $cond: {
                      if: {
                        $in: [
                          {
                            $toObjectId: {
                              $arrayElemAt: [
                                `$operation_data.${data}.updated_by`,
                                0,
                              ],
                            },
                          },
                          '$userData._id',
                        ],
                      },
                      then: {
                        $concat: [
                          { $arrayElemAt: ['$userData.first_name', 0] },
                          ' ',
                          { $arrayElemAt: ['$userData.last_name', 0] },
                        ],
                      },
                      else: '',
                    },
                  },
                  updatedBy: {
                    $cond: {
                      if: {
                        $in: [
                          {
                            $toObjectId: {
                              $arrayElemAt: [
                                `$operation_data.${data}.updatedBy`,
                                0,
                              ],
                            },
                          },
                          '$userData1._id',
                        ],
                      },
                      then: {
                        $concat: [
                          { $arrayElemAt: ['$userData1.first_name', 0] },
                          ' ',
                          { $arrayElemAt: ['$userData1.last_name', 0] },
                        ],
                      },
                      else: '',
                    },
                  },
                  user_id: {
                    $cond: {
                      if: {
                        $in: [
                          {
                            $toObjectId: {
                              $arrayElemAt: [
                                `$operation_data.${data}.user_id`,
                                0,
                              ],
                            },
                          },
                          '$users2._id',
                        ],
                      },
                      then: {
                        $concat: [
                          { $arrayElemAt: ['$users2.first_name', 0] },
                          ' ',
                          { $arrayElemAt: ['$users2.last_name', 0] },
                        ],
                      },
                      else: '',
                    },
                  },
                },
              },

              {
                case: { $in: ['$key', CompanyData] },
                then: {
                  ...pipeline(data, 'company_id', 'name', 'companies'),
                  ...pipeline(data, 'country_id', 'country_name', 'countries'),
                  ...pipeline(data, 'warehouse_id', 'name', 'warehouses'),
                  ...pipeline(
                    data,
                    'marketplace_id',
                    'marketplace_code',
                    'marketplaces'
                  ),
                  // Additional fields for update-store-detail
                  ...pipeline(
                    data,
                    'purchase_account_id',
                    'consignee_name',
                    'purchaseAccounts'
                  ),
                  ...pipeline(
                    data,
                    'shiprocket_account_id',
                    'user_name',
                    'shiprocketAccounts'
                  ),
                },
              },
              {
                case: { $in: ['$key', roleData] },
                then: {
                  ...pipeline(data, 'role_id', 'role_name', 'roleDetails'),
                },
              },
              {
                case: { $in: ['$key', backOrderData] },
                then: {
                  ...pipeline(data, 'auto_comment', 'comment', 'autoComment'),
                  ...pipeline(
                    data,
                    'no_any_activities',
                    'order_status',
                    'orderStatuses'
                  ),
                  ...pipeline(
                    data,
                    'order_status',
                    'order_status',
                    'orderStatus'
                  ),
                  ...pipeline(data, 'store_id', 'store_name', 'storeData'),

                  bucket_name: {
                    $cond: {
                      if: {
                        $in: [
                          {
                            $toObjectId: {
                              $arrayElemAt: [
                                `$operation_data.${data}.bucket_name`,
                                0,
                              ],
                            },
                          },
                          '$users._id',
                        ],
                      },
                      then: {
                        $concat: [
                          { $arrayElemAt: ['$users.first_name', 0] },
                          ' ',
                          { $arrayElemAt: ['$users.last_name', 0] },
                        ],
                      },
                      else: '',
                    },
                  },
                },
              },
              {
                case: { $in: ['$key', countryData] },
                then: {
                  ...pipeline(data, 'country_id', 'country_name', 'countries'),
                },
              },
              {
                case: { $in: ['$key', tranckingData] },
                then: {
                  ...pipeline(data, 'courier_id', 'courier_name', 'couriers'),
                },
              },

              {
                case: { $in: ['$key', orderData] },
                then: {
                  ...pipeline(
                    data,
                    'order_status',
                    'order_status',
                    'orderStatuses'
                  ),
                  ...pipeline(data, 'courier_id', 'courier_name', 'couriers'),
                  ...pipeline(data, 'store_id', 'store_name', 'stores'),

                  safety_claim_by: {
                    $cond: {
                      if: {
                        $in: [
                          {
                            $toObjectId: {
                              $arrayElemAt: [
                                `$operation_data.${data}.safety_claim_by`,
                                0,
                              ],
                            },
                          },
                          '$users._id',
                        ],
                      },
                      then: {
                        $concat: [
                          { $arrayElemAt: ['$users.first_name', 0] },
                          ' ',
                          { $arrayElemAt: ['$users.last_name', 0] },
                        ],
                      },
                      else: '',
                    },
                  },
                  // ADD: Missing validated_by field transformation
                  validated_by: {
                    $cond: {
                      if: {
                        $in: [
                          {
                            $toObjectId: {
                              $arrayElemAt: [
                                `$operation_data.${data}.validated_by`,
                                0,
                              ],
                            },
                          },
                          '$validatedUsers._id',
                        ],
                      },
                      then: {
                        $concat: [
                          { $arrayElemAt: ['$validatedUsers.first_name', 0] },
                          ' ',
                          { $arrayElemAt: ['$validatedUsers.last_name', 0] },
                        ],
                      },
                      else: '',
                    },
                  },
                },
              },
            ],
            default: {},
          },
        },
      ],
    });

    const mapCommonTransformation = () => {
      return {
        $map: {
          input: '$operation_data',
          as: 'data',
          in: {
            $mergeObjects: [
              '$$data',
              {
                $switch: {
                  branches: [
                    {
                      case: { $in: ['$key', transactionArray] },
                      then: {
                        ...commonPipeline('store_id', 'store_name', 'stores'),
                        ...commonPipeline('company_id', 'name', 'companies'),
                        ...commonPipeline(
                          'country_id',
                          'country_name',
                          'countries'
                        ),
                        ...commonPipeline('warehouse_id', 'name', 'warehouses'),
                        ...commonPipeline(
                          'marketplace_id',
                          'marketplace_code',
                          'marketplaces'
                        ),
                        ...commonPipeline('role_id', 'role_name', 'roles'),
                        ...commonPipeline(
                          'group_id',
                          'group_name',
                          'autoOrderingGroups'
                        ),

                        created_by: {
                          $cond: {
                            if: {
                              $in: [
                                { $toObjectId: '$$data.created_by' },
                                '$users._id',
                              ],
                            },
                            then: {
                              $concat: [
                                { $arrayElemAt: ['$users.first_name', 0] },
                                ' ',
                                { $arrayElemAt: ['$users.last_name', 0] },
                              ],
                            },
                            else: '',
                          },
                        },
                        createdBy: {
                          $cond: {
                            if: {
                              $in: [
                                { $toObjectId: '$$data.createdBy' },
                                '$users1._id',
                              ],
                            },
                            then: {
                              $concat: [
                                { $arrayElemAt: ['$users1.first_name', 0] },
                                ' ',
                                { $arrayElemAt: ['$users1.last_name', 0] },
                              ],
                            },
                            else: '',
                          },
                        },
                        updated_by: {
                          $cond: {
                            if: {
                              $in: [
                                { $toObjectId: '$$data.updated_by' },
                                '$userData._id',
                              ],
                            },
                            then: {
                              $concat: [
                                { $arrayElemAt: ['$userData.first_name', 0] },
                                ' ',
                                { $arrayElemAt: ['$userData.last_name', 0] },
                              ],
                            },
                            else: '',
                          },
                        },
                        updatedBy: {
                          $cond: {
                            if: {
                              $in: [
                                { $toObjectId: '$$data.updatedBy' },
                                '$userData1._id',
                              ],
                            },
                            then: {
                              $concat: [
                                { $arrayElemAt: ['$userData1.first_name', 0] },
                                ' ',
                                { $arrayElemAt: ['$userData1.last_name', 0] },
                              ],
                            },
                            else: '',
                          },
                        },
                        user_id: {
                          $cond: {
                            if: {
                              $in: [
                                { $toObjectId: '$$data.user_id' },
                                '$users2._id',
                              ],
                            },
                            then: {
                              $concat: [
                                { $arrayElemAt: ['$users2.first_name', 0] },
                                ' ',
                                { $arrayElemAt: ['$users2.last_name', 0] },
                              ],
                            },
                            else: '',
                          },
                        },
                      },
                    },
                    {
                      case: { $in: ['$key', CompanyData] },
                      then: {
                        ...commonPipeline('company_id', 'name', 'companies'),
                        ...commonPipeline(
                          'country_id',
                          'country_name',
                          'countries'
                        ),
                        ...commonPipeline('warehouse_id', 'name', 'warehouses'),
                        ...commonPipeline(
                          'marketplace_id',
                          'marketplace_code',
                          'marketplaces'
                        ),
                        // Additional fields for update-store-detail
                        ...commonPipeline(
                          'purchase_account_id',
                          'consignee_name',
                          'purchaseAccounts'
                        ),
                        ...commonPipeline(
                          'shiprocket_account_id',
                          '_id',
                          'shiprocketAccounts'
                        ),
                      },
                    },
                    {
                      case: { $in: ['$key', roleData] },
                      then: {
                        ...commonPipeline(
                          'role_id',
                          'role_name',
                          'roleDetails'
                        ),
                      },
                    },
                    {
                      case: { $in: ['$key', backOrderData] },
                      then: {
                        ...commonPipeline(
                          'auto_comment',
                          'comment',
                          'autoComment'
                        ),
                        ...commonPipeline(
                          'no_any_activities',
                          'order_status',
                          'orderStatuses'
                        ),
                        ...commonPipeline(
                          'order_status',
                          'order_status',
                          'orderStatus'
                        ),
                        ...commonPipeline(
                          'store_id',
                          'store_name',
                          'storeData'
                        ),

                        bucket_name: {
                          $cond: {
                            if: {
                              $eq: [
                                '$operation_data.bucket_name',
                                '$users._id',
                              ],
                            },
                            then: {
                              $concat: [
                                { $arrayElemAt: ['$users.first_name', 0] },
                                ' ',
                                { $arrayElemAt: ['$users.last_name', 0] },
                              ],
                            },
                            else: '$$data.bucket_name',
                          },
                        },
                      },
                    },
                    {
                      case: { $in: ['$key', countryData] },
                      then: {
                        ...commonPipeline(
                          'country_id',
                          'country_name',
                          'country'
                        ),
                      },
                    },
                    {
                      case: { $in: ['$key', tranckingData] },
                      then: {
                        ...commonPipeline(
                          'courier_id',
                          'courier_name',
                          'couriers'
                        ),
                      },
                    },

                    {
                      case: { $in: ['$key', loginData] },
                      then: {
                        ...commonPipeline('role_id', 'role_name', 'roles'),
                      },
                    },

                    {
                      case: { $in: ['$key', orderData] },
                      then: {
                        ...commonPipeline(
                          'order_status',
                          'order_status',
                          'orderStatuses'
                        ),
                        ...commonPipeline(
                          'courier_id',
                          'courier_name',
                          'couriers'
                        ),
                        ...commonPipeline('store_id', 'store_name', 'stores'),
                        safety_claim_by: {
                          $cond: {
                            if: {
                              $in: [
                                { $toObjectId: '$$data.safety_claim_by' },
                                '$users._id',
                              ],
                            },
                            then: {
                              $concat: [
                                { $arrayElemAt: ['$users.first_name', 0] },
                                ' ',
                                { $arrayElemAt: ['$users.last_name', 0] },
                              ],
                            },
                            else: '',
                          },
                        },
                        // ADD: Missing validated_by field transformation for common pipeline
                        validated_by: {
                          $cond: {
                            if: {
                              $in: [
                                { $toObjectId: '$$data.validated_by' },
                                '$validatedUsers._id',
                              ],
                            },
                            then: {
                              $concat: [
                                {
                                  $arrayElemAt: [
                                    '$validatedUsers.first_name',
                                    0,
                                  ],
                                },
                                ' ',
                                {
                                  $arrayElemAt: [
                                    '$validatedUsers.last_name',
                                    0,
                                  ],
                                },
                              ],
                            },
                            else: '',
                          },
                        },
                      },
                    },
                  ],
                  default: {},
                },
              },
            ],
          },
        },
      };
    };

    const lookupStages = getLookupStagesByKey(key);
    pipelineStages.push(...lookupStages);
    pipelineStages.push({
      $project: {
        operation: 1,
        operation_by: 1,
        key: 1,
        ip_address: 1,
        createdAt: 1,
        updatedAt: 1,
        first_name: { $arrayElemAt: ['$userDetails.first_name', 0] },
        last_name: { $arrayElemAt: ['$userDetails.last_name', 0] },
        role_name: {
          $ifNull: [{ $arrayElemAt: ['$role.role_name', 0] }, 'Super Admin'],
        },
        operation_data: {
          $cond: {
            if: { $eq: ['$operation', 'UPDATE'] },
            then: [
              {
                oldData: mapUpdateDataTransformation('oldData'),
                updatedData: mapUpdateDataTransformation('updatedData'),
              },
            ],
            else: mapCommonTransformation(),
          },
        },
      },
    });
    const data = await SystemLogsModel.aggregate(pipelineStages);
    return {
      status: httpStatus.OK,
      message: 'Get Details.',
      data,
    };
  } catch (error) {
    console.error('error: ', error);
    errorHandler.errorM({
      action_type: 'find-common',
      error_data: error,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
      data: {},
    };
  }
};

async function generateExportSystemLogReportForAdmin(filter, options, userId) {
  try {
    generateExportSystemLogReport(filter, userId);
    return {
      status: httpStatus.OK,
      message: 'System Log export started successfully',
    };
  } catch (error) {
    console.error('[SYSTEM-EXPORT] Failed to start system log export', error);
    errorHandler.errorM({
      action_type: 'generate-export-systemlog-report',
      error_data: error,
    });
    return {
      status: httpStatus.FORBIDDEN,
      message: 'Exception occurred! Please try again later.',
    };
  }
}

const convertUTCToIST = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
  });
};

async function generateExportSystemLogReport(filter, userId) {
  const dbCollection = db.collection('tbl_system_logs');
  const exportHistory = db.collection('tbl_exported_file_histories');

  const regex = filter.search ? new RegExp(filter.search, 'i') : null;
  const { startDate, endDate } = getStartAndEndDate(filter);
  const baseMatchConditions = [];

  if (filter.operation_by) {
    baseMatchConditions.push({
      operation_by: new mongoose.Types.ObjectId(filter.operation_by),
    });
  }

  if (filter.operation) {
    baseMatchConditions.push({ operation: filter.operation });
  }

  baseMatchConditions.push({
    createdAt: { $gte: startDate, $lte: endDate },
  });

  if (regex) {
    baseMatchConditions.push({
      $or: [
        { operation: regex },
        { key: regex },
        { ip_address: regex },
        { 'userDetails.first_name': regex },
        { 'userDetails.last_name': regex },
        { 'role.role_name': regex },
      ],
    });
  }

  const allFilePaths = [];
  let exportHistoryId;
  let batchIndex = 1;
  let totalProcessed = 0;
  let currentFileRecords = [];
  let currentRecordCount = 0;
  const maxRecordsPerFile = 100000;

  try {
    const totalDocs = await dbCollection
      .aggregate([
        userLookupStage,
        roleLookupStage,
        { $match: { $and: baseMatchConditions } },
        { $count: 'total' },
      ])
      .toArray();
    const totalDocuments = totalDocs?.[0]?.total || 0;

    const insertResult = await exportHistory.insertOne({
      file_name: `system_logs_export_${getFormattedTimestamp()}_processing`,
      file_origin_name: `system_logs_export_${getFormattedTimestamp()}_processing.csv`,
      file_records: 0,
      file_type: 'CSV',
      mime_type: 'text/csv',
      file_size: '0 KB',
      is_file_uploaded: false,
      processing_status: 'PROCESSING',
      progress_percentage: 0,
      total_records: totalDocuments,
      processed_records: 0,
      can_download: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: new mongoose.Types.ObjectId(userId),
      exported_type: 'system-log',
      total_batches: 0,
      generated_files: [],
    });
    exportHistoryId = insertResult.insertedId;

    const pipeline = [
      userLookupStage,
      roleLookupStage,
      { $match: { $and: baseMatchConditions } },
      {
        $addFields: {
          first_name: { $arrayElemAt: ['$userDetails.first_name', 0] },
          last_name: { $arrayElemAt: ['$userDetails.last_name', 0] },
          role_name: {
            $ifNull: [{ $arrayElemAt: ['$role.role_name', 0] }, 'Super Admin'],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          createdAt: 1,
          operation: 1,
          key: 1,
          ip_address: 1,
          first_name: 1,
          last_name: 1,
          role_name: 1,
        },
      },
    ];

    const cursor = dbCollection
      .aggregate(pipeline, { allowDiskUse: true })
      .batchSize(500);

    const writeCurrentBatch = async () => {
      if (!currentFileRecords.length) return;

      const fileName = `system_logs_export_${getFormattedTimestamp()}_${batchIndex}.csv`;
      const filePath = `/system-log-list/${fileName}`;
      const outputPath = path.resolve(
        __dirname,
        `../uploads/system-log-list/${fileName}`
      );

      const csvWriter = createObjectCsvWriter({
        path: outputPath,
        header: [
          { id: 'operation', title: 'Operation' },
          { id: 'first_name', title: 'Performed By' },
          { id: 'key', title: 'Operation Key' },
          { id: 'ip_address', title: 'IP Address' },
          { id: 'role_name', title: 'Role Name' },
          { id: 'createdAt', title: 'Created Date' },
        ],
      });

      await csvWriter.writeRecords(currentFileRecords);
      const stats = fs.statSync(outputPath);
      const fileSize = (stats.size / 1024).toFixed(2);

      allFilePaths.push({
        path: filePath,
        name: fileName,
        records: currentFileRecords.length,
        size: `${fileSize} KB`,
        batchNumber: batchIndex,
        can_download: true,
      });

      totalProcessed += currentFileRecords.length;
      batchIndex++;
      currentFileRecords = [];
      currentRecordCount = 0;
    };

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      currentFileRecords.push({
        createdAt: convertUTCToIST(doc.createdAt),
        operation: doc.operation || '-',
        key: doc.key || '-',
        ip_address: doc.ip_address || '-',
        first_name: `${doc.first_name || '-'} ${doc.last_name || ''}`.trim(),
        role_name: doc.role_name || '-',
      });
      currentRecordCount++;

      if (currentRecordCount >= maxRecordsPerFile) await writeCurrentBatch();
    }

    if (currentFileRecords.length) await writeCurrentBatch();

    const totalFileSize = allFilePaths.reduce(
      (sum, file) => sum + parseFloat(file.size),
      0
    );

    await exportHistory.updateOne(
      { _id: exportHistoryId },
      {
        $set: {
          file_name: allFilePaths[0]?.path || null,
          file_origin_name: allFilePaths[0]?.name || null,
          file_records: totalProcessed,
          file_size: `${totalFileSize.toFixed(2)} KB`,
          processing_status: 'COMPLETED',
          progress_percentage: 100,
          processed_records: totalProcessed,
          is_file_uploaded: true,
          can_download: true,
          updated_at: new Date(),
          total_batches: batchIndex - 1,
          generated_files: allFilePaths,
        },
      }
    );

    return {
      status: 200,
      message: `${totalProcessed} system log records exported.`,
      filePath: allFilePaths[0]?.path || null,
    };
  } catch (error) {
    console.error('[SYSTEM-EXPORT] Failed', error);
    if (exportHistoryId) {
      await exportHistory.updateOne(
        { _id: exportHistoryId },
        {
          $set: {
            processing_status: 'FAILED',
            error_message: error.message,
            updated_at: new Date(),
            can_download: false,
          },
        }
      );
    }
    return { status: 500, message: 'Failed to export system logs.' };
  }
}

module.exports = {
  getSystemLogByDate,
  getSystemLogOperationList,
  getSystemLogById,
  generateExportSystemLogReportForAdmin,
};
