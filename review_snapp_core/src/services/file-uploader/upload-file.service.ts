// @ts-nocheck
const httpStatus = require('http-status');
const nodeXlsx = require('node-xlsx');
const mongoose = require('mongoose');
const db = mongoose.connection;
const csvParser = require('csv-parser');
const { uploadFileTypes } = require('../../config/constants');
const errorHandler = require('../../utils/error.handler');
const FileUploadModel = require('../../models/FileUploadModel');
const OrderItemModel = require('../../models/OrderItemModel');
const transactionModel = require('../../models/transactionModel');
const creditCardModel = require('../../models/creditCardModel');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { systemLog } = require('../../utils/system-log');

const importSheet = async (data, fileData, type) => {
  try {
    let filename = fileData.path.split('/').pop();
    let picture = filename.replace('uploads\\', '');
    const file = path.join(
      __dirname,
      `/../../uploads/file-uploader/${picture}`
    );
    const fileBuffer = fs.readFileSync(`${file}`);
    const to_string = fileBuffer.toString();
    const split_lines = to_string.split('\n');
    let lenghLimit = split_lines.length - 2;

    if (!fs.existsSync(file)) {
      return {
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'File not found!',
      };
    }

    let fileToProcess = file;
    if (file.endsWith('.xls') || file.endsWith('.xlsx')) {
      try {
        fileToProcess = excelToCsv(file);
        let { data } = nodeXlsx.parse(fs.readFileSync(fileToProcess))[0];
        const filteredData = data.filter((row) =>
          row.some((cell) => cell !== null && cell.toString().trim() !== '')
        );

        lenghLimit = filteredData.length - 1;
      } catch (error) {
        fs.unlink(file, async function (err) {
          if (err) {
            console.err('error while REMOVE [File]');
          }
        });
        return {
          status: httpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error converting Excel file to CSV!',
        };
      }
    }

    if (lenghLimit > 25000) {
      fs.unlink(file, async function (err) {
        if (err) {
          console.err('error while REMOVE [File]');
        }
      });
      return {
        status: 400,
        message: 'Please import file with maximum 25000 items limit',
      };
    }

    const fileTypeData = uploadFileTypes.find(
      (ele) => ele.value === parseInt(type)
    );

    const fileObj = {
      created_by: data.userId,
      store_id: data.store_id,
      file_origin_name: fileData.name,
      file_records: lenghLimit,
      file_type: fileTypeData.key,
      mime_type: fileData.type,
      file_size: fileData.size,
      file_uploaded_status: 'FAILED',
      file_name: picture,
    };

    if (
      data.store_id ||
      data.store_id === '' ||
      data.store_id === null ||
      data.store_id === undefined
    )
      fileObj['store_id'] = '67c5b59b2354f61ede9603a5'; // dummy for temporary

    let fileUploadDoc = await FileUploadModel.create(fileObj);

    let filResponse;
    const fileHeaders = await db
      .collection('tbl_file_upload_header_masters')
      .find({ title: fileTypeData.slug_value })
      .limit(1)
      .toArray();

    if (type === '1') {
      filResponse = await processShipmentRateFile(
        fileToProcess,
        picture,
        fileHeaders[0].headers,
        data.store_id,
        lenghLimit,
        fileUploadDoc._id,
        data.userId
      );
    }

    if (type === '2') {
      filResponse = await processHsnFile(
        fileToProcess,
        picture,
        fileHeaders[0].headers,
        lenghLimit,
        fileUploadDoc._id,
        data.userId
      );
    }

    if (type === '3') {
      // Referral fee file process
      filResponse = await processProductReferralFee(
        fileToProcess,
        picture,
        fileHeaders[0].headers,
        lenghLimit,
        fileUploadDoc._id,
        data.userId,
        data.store_id
      );
    }

    if (type === '4') {
      // Product Based HSN Code with class
      filResponse = await processProductBasedHSN(
        fileToProcess,
        picture,
        fileHeaders[0].headers,
        lenghLimit,
        fileUploadDoc._id,
        data.userId
      );
    }

    if (type === '6') {
      // Product Update
      filResponse = await processProductWeightUpdate(
        fileToProcess,
        picture,
        fileHeaders[0].headers,
        lenghLimit,
        fileUploadDoc._id,
        data.userId
      );
    }

    let statusD =
      filResponse.status === httpStatus.BAD_REQUEST ? 'FAILED' : 'COMPLETED';
    await FileUploadModel.updateOne(
      { _id: fileUploadDoc._id },
      { $set: { file_uploaded_status: statusD, message: filResponse.message } }
    );

    fs.unlink(fileToProcess, (err) => {
      if (err) console.error(err);
    });

    return filResponse;
  } catch (error) {
    errorHandler.errorM({
      action_type: 'verify-file-while-import',
      error_data: error,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message,
    };
  }
};

const fileStatusUpdate = async (fileName, status, userId) => {
  await FileUploadModel.findOneAndUpdate(
    { file_name: fileName },
    { $set: { file_uploaded_status: status, status: 1 } }
  );

  await systemLog(
    'CREATE',
    { file_name: fileName, status },
    userId,
    'update-file-status'
  );
  return true;
};

const excelToCsv = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
    const csvFilePath = path.join(
      path.dirname(filePath),
      `${path.basename(filePath, path.extname(filePath))}.csv`
    );

    fs.writeFileSync(
      csvFilePath,
      xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName], { FS: ',' }) // Changed separator to comma
    );

    // delete the original Excel file
    fs.unlinkSync(filePath);

    return csvFilePath;
  } catch (error) {
    console.error('Error converting Excel to CSV:', error);
    throw new Error('Failed to convert Excel file to CSV.');
  }
};

const verifyFile = async (data, type) => {
  try {
    // Check if an order with the same order_number already exists

    const fileTypeData = uploadFileTypes.find(
      (ele) => ele.value === parseInt(type)
    );
    const existingOrder = await FileUploadModel.find(
      {
        // user_id: data.userId,
        file_origin_name: data.file_name,
        file_type: fileTypeData.key,
        status: 1,
      },
      { file_records: 1 }
    ).sort({ _id: -1 });
    if (existingOrder.length > 0) {
      return {
        status: httpStatus.CONFLICT,
        message: `The same file already imported with ${existingOrder[0].file_records} records `,
      };
    } else {
      return {
        status: httpStatus.OK,
        message: 'Ready to import',
      };
    }
  } catch (err) {
    errorHandler.errorM({
      action_type: 'verify-file-while-import',
      error_data: err,
    });
    return {
      status: httpStatus.BAD_REQUEST,
      message: 'Something went wrong with file',
    };
  }
};
const processShipmentRateFile = async (
  file,
  fileName,
  fileHeaders,
  storeId,
  fileRecordLength,
  fileUploadId,
  userId
) => {
  let count = 0,
    rowCount = 0,
    isCheck = false;

  let db = mongoose.connection;
  let shipmentRateData = db
    .collection('tbl_shipment_rates')
    .initializeOrderedBulkOp();

  const hsnProcess = new Promise((resolve, reject) => {
    let stream = fs
      .createReadStream(file)
      .pipe(csvParser({ separator: ',', skipEmptyLines: true }));

    stream.on('error', (error) => {
      console.error('File Read Error:', error);
      reject({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error reading the shipment rate file!',
      });
    });

    stream.on('data', async (row) => {
      if (!isCheck) {
        const rowKeys = Object.keys(row).map((key) => key.trim().toLowerCase());
        const requiredKeys = fileHeaders.map((header) =>
          header.trim().toLowerCase()
        );

        const checkAllKeys = requiredKeys.every((key) => rowKeys.includes(key));
        if (!checkAllKeys) {
          const missingKeys = requiredKeys.filter(
            (key) => !rowKeys.includes(key)
          );
          isCheck = true;
          await fileStatusUpdate(fileName, 'FAILED', userId);
          return reject({
            status: httpStatus.BAD_REQUEST,
            message: `File headers are incorrect! Missing: ${missingKeys.join(
              ', '
            )}`,
          });
        }
      }
      isCheck = true;

      // Validate mandatory fields
      const mandatoryFields = [
        'courier name',
        'courier id',
        'type',
        'kg',
        'rate',
      ];
      const missingFields = mandatoryFields.filter(
        (field) => !row[field] || row[field].trim() === ''
      );

      if (missingFields.length > 0) {
        console.warn(
          `Skipping row ${rowCount + 1}: Missing fields - ${missingFields.join(
            ', '
          )}`
        );
        return;
      }

      // Validate courier_id
      const courierIdNum = parseInt(row['courier id']);
      if (isNaN(courierIdNum) || courierIdNum < 1 || courierIdNum > 99999) {
        console.warn(
          `Skipping row ${rowCount + 1}: Invalid courier id - ${
            row['courier id']
          }`
        );
        return;
      }

      // Create data object
      const obj = {
        courier_name: row['courier name'].trim(),
        courier_id: courierIdNum,
        type: row['type'].trim().toLowerCase() === 'regular' ? 1 : 2,
        weight_kg: parseFloat(parseFloat(row['kg']).toFixed(2)),
        shipment_rate: parseFloat(parseFloat(row['rate']).toFixed(2)),
        import_from: 'file',
        file_upload_id: fileUploadId,
        updated_by: mongoose.Types.ObjectId(userId),
        updatedAt: new Date(),
      };

      // Perform upsert operation
      shipmentRateData
        .find({
          courier_name: row['courier name'].trim(),
          type: obj.type,
          weight_kg: obj.weight_kg,
          store_id: mongoose.Types.ObjectId(storeId),
          status: 1,
        })
        .upsert()
        .update({
          $set: obj,
          $setOnInsert: {
            createdAt: new Date(),
            created_by: new mongoose.Types.ObjectId(userId),
          },
        });

      count++;
      rowCount++;

      if (count === 1000 || rowCount === fileRecordLength) {
        stream.pause();
        try {
          await shipmentRateData.execute(async function (err) {
            if (err) throw err;
            shipmentRateData = db
              .collection('tbl_shipment_rates')
              .initializeOrderedBulkOp();
            count = 0;
          });
        } catch (error) {
          console.error('Error inserting shipment:', error);
          await fileStatusUpdate(fileName, 'FAILED', userId);
          return reject({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error inserting shipment data!',
          });
        }
        stream.resume();
      }

      if (rowCount === fileRecordLength) {
        await fileStatusUpdate(fileName, 'COMPLETED', userId);
      }
    });

    stream.on('end', async () => {
      await fileStatusUpdate(fileName, 'PROCESSING', userId);
      resolve({
        status: httpStatus.OK,
        message: 'Shipment rate file imported successfully!',
      });
    });
  });

  try {
    return await hsnProcess;
  } catch (err) {
    errorHandler.errorM({
      action_type: 'import-shipment-rate-file',
      error_data: err,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: err?.message ? err.message : err,
    };
  }
};

const processHsnFile = async (
  file,
  fileName,
  fileHeaders,
  fileRecordLength,
  fileUploadId,
  userId
) => {
  let count = 0,
    rowCount = 0,
    isCheck = false;

  let db = mongoose.connection;
  let bulkASBNItem = db.collection('tbl_hsn_masters').initializeOrderedBulkOp();

  const hsnProcess = new Promise((resolve, reject) => {
    let stream = fs
      .createReadStream(file)
      .pipe(csvParser({ separator: ',', skipEmptyLines: true }));

    stream.on('error', (error) => {
      console.error('File Read Error:', error);
      reject({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error reading the shipment rate file!',
      });
    });

    stream.on('data', async (row) => {
      if (!isCheck) {
        const rowKeys = Object.keys(row).map((key) => key.trim().toLowerCase());
        const requiredKeys = fileHeaders.map((header) =>
          header.trim().toLowerCase()
        );

        const checkAllKeys = requiredKeys.every((key) => rowKeys.includes(key));
        if (!checkAllKeys) {
          const missingKeys = requiredKeys.filter(
            (key) => !rowKeys.includes(key)
          );
          isCheck = true;
          await fileStatusUpdate(fileName, 'FAILED', userId);
          return reject({
            status: httpStatus.BAD_REQUEST,
            message: `File headers are incorrect! Missing: ${missingKeys.join(
              ', '
            )}`,
          });
        }
      }
      isCheck = true;

      // Validate mandatory fields
      const mandatoryFields = [
        'HSN Code',
        'BCD',
        'Excise AIDC',
        'Health Cess',
        'SWS',
        'Customs AIDC',
        'Comp. Cess',
        'GST Rate',
      ];
      const missingFields = mandatoryFields.filter(
        (field) => !row[field] || row[field].trim() === ''
      );

      if (missingFields.length > 0) {
        console.warn(
          `Skipping row ${rowCount + 1}: Missing fields - ${missingFields.join(
            ', '
          )}`
        );
        return;
      }

      const obj = {
        hsn_code: row['HSN Code'].trim(),
        bcd_rate: parseFloat(row['BCD'].trim()),
        excise_aidc: parseFloat(row['Excise AIDC'].trim()),
        health_cess_rate: parseFloat(row['Health Cess'].trim()),
        social_welfare_surcharge: parseFloat(row['SWS'].trim()),
        customs_aidc: parseFloat(row['Customs AIDC'].trim()),
        compensation_cess: parseFloat(row['Comp. Cess'].trim()),
        gst_rate: parseFloat(row['GST Rate'].trim()),
        created_by: userId && new mongoose.Types.ObjectId(userId),
        updated_by: userId && new mongoose.Types.ObjectId(userId),
        import_from: 'file',
        file_upload_id: fileUploadId,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      bulkASBNItem
        .find({
          hsn_code: obj.hsn_code,
          status: 1,
        })
        .upsert()
        .update({ $set: obj });

      count++;
      rowCount++;
      if (count === 1000 || rowCount === fileRecordLength) {
        stream.pause();
        try {
          // In slot
          await bulkASBNItem.execute(async function (err) {
            if (err) throw err;
            bulkASBNItem = db
              .collection('tbl_hsn_masters')
              .initializeOrderedBulkOp();
            count = 0;
          });
        } catch (error) {
          console.error('Error inserting HSN :', error);
          await fileStatusUpdate(fileName, 'FAILED', userId);
          return reject({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error inserting HSN data!',
          });
        }
        stream.resume();
      }
      if (rowCount === fileRecordLength) {
        await fileStatusUpdate(fileName, 'COMPLETED', userId);
      }
    });

    stream.on('end', async () => {
      await fileStatusUpdate(fileName, 'PROCESSING', userId);
      resolve({
        status: httpStatus.OK,
        message: 'HSN file imported successfully!',
      });
    });
  });

  try {
    return await hsnProcess;
  } catch (err) {
    errorHandler.errorM({
      action_type: 'import-hsn-file',
      error_data: err,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: err?.message ? err.message : err,
    };
  }
};

const processProductBasedHSN = async (
  file,
  fileName,
  fileHeaders,
  fileRecordLength,
  fileUploadId,
  userId
) => {
  let count = 0,
    rowCount = 0,
    isCheck = false;
  let db = mongoose.connection;
  let bulkASBNItem = db
    .collection('tbl_product_based_hsns')
    .initializeOrderedBulkOp();

  const productLevelHSNBulk = new Promise((resolve, reject) => {
    let stream = fs
      .createReadStream(file)
      .pipe(csvParser({ separator: ',', skipEmptyLines: true }));
    stream.on('error', (error) => {
      console.error('File Read Error:', error);
      reject({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error reading the shipment rate file!',
      });
    });

    stream.on('data', async (row) => {
      if (!isCheck) {
        const rowKeys = Object.keys(row).map((key) => key.trim().toLowerCase());
        const requiredKeys = fileHeaders.map((header) =>
          header.trim().toLowerCase()
        );
        const checkAllKeys = requiredKeys.every((key) => rowKeys.includes(key));

        if (!checkAllKeys) {
          const missingKeys = requiredKeys.filter(
            (key) => !rowKeys.includes(key)
          );
          isCheck = true;
          await fileStatusUpdate(fileName, 'FAILED', userId);
          return reject({
            status: httpStatus.BAD_REQUEST,
            message: `File headers are incorrect! Missing: ${missingKeys.join(
              ', '
            )}`,
          });
        }
      }
      isCheck = true;

      // Validate mandatory fields
      const mandatoryFields = ['Master SKU', 'HSN code', 'Class Id'];
      const missingFields = mandatoryFields.filter(
        (field) => !row[field] || row[field].trim() === ''
      );

      if (missingFields.length > 0) {
        console.warn(
          `Skipping row ${rowCount + 1}: Missing fields - ${missingFields.join(
            ', '
          )}`
        );
      } else {
        const obj = {
          master_sku: row['Master SKU'].trim(),
          hsn_code: row['HSN code'].trim(),
          class_id: parseInt(row['Class Id'].trim()),
          import_from: 'file',
          file_upload_id: fileUploadId,
          created_by: userId && new mongoose.Types.ObjectId(userId),
          updated_by: userId && new mongoose.Types.ObjectId(userId),
        };

        bulkASBNItem
          .find({
            master_sku: row['Master SKU'].trim(),
            class_id: parseInt(row['Class Id'].trim()),
          })
          .upsert()
          .update({ $set: obj, $setOnInsert: { createdAt: new Date() } });
      }

      count++;
      rowCount++;

      if (count === 1000 || rowCount === fileRecordLength) {
        stream.pause();
        try {
          // In slot
          await bulkASBNItem.execute(async function (err) {
            if (err) throw err;
            bulkASBNItem = await db
              .collection('tbl_product_based_hsns')
              .initializeOrderedBulkOp();
            count = 0;
            stream.resume();
          });
        } catch (error) {
          console.error('Error inserting HSN code:', error);
          await fileStatusUpdate(fileName, 'FAILED', userId);
          return reject({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error inserting shipment rate data!',
          });
        }
      }

      if (rowCount === fileRecordLength) {
        await fileStatusUpdate(fileName, 'COMPLETED', userId);
      }
    });

    stream.on('end', async () => {
      await fileStatusUpdate(fileName, 'PROCESSING', userId);
      resolve({
        status: httpStatus.OK,
        message: 'HSN code file imported successfully!',
      });
    });
  });

  try {
    return await productLevelHSNBulk;
  } catch (err) {
    errorHandler.errorM({
      action_type: 'import-shipment-rate-file',
      error_data: err,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: err?.message ? err.message : err,
    };
  }
};

const processProductWeightUpdate = async (
  file,
  fileName,
  fileHeaders,
  fileRecordLength,
  fileUploadId,
  userId
) => {
  let count = 0,
    rowCount = 0,
    isCheck = false;
  let db = mongoose.connection;

  let bulkOp = db.collection('tbl_product_masters').initializeUnorderedBulkOp();

  const productUpdateProcess = new Promise((resolve, reject) => {
    let stream = fs
      .createReadStream(file)
      .pipe(csvParser({ separator: ',', skipEmptyLines: true }));

    stream.on('error', async (error) => {
      console.error('CSV Read Error:', error);
      await fileStatusUpdate(fileName, 'FAILED');
      reject({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error reading the product update file!',
      });
    });

    stream.on('data', async (row) => {
      if (!isCheck) {
        const rowKeys = Object.keys(row).map((key) => key.trim().toLowerCase());
        const requiredKeys = fileHeaders.map((header) =>
          header.trim().toLowerCase()
        );
        const allKeysExist = requiredKeys.every((key) => rowKeys.includes(key));

        if (!allKeysExist) {
          const missingKeys = requiredKeys.filter(
            (key) => !rowKeys.includes(key)
          );
          isCheck = true;
          await fileStatusUpdate(fileName, 'FAILED');
          return reject({
            status: httpStatus.BAD_REQUEST,
            message: `File headers mismatch. Missing: ${missingKeys.join(
              ', '
            )}`,
          });
        }
      }
      isCheck = true;

      const masterSku = row['master_sku']?.trim();
      if (!masterSku) {
        console.warn(`Skipping row ${rowCount + 1}: Missing master_sku`);
        rowCount++;
        return;
      }

      const updateFields = {};
      if (!isNaN(parseFloat(row.actual_package_height)))
        updateFields.actual_package_height = parseFloat(
          row.actual_package_height
        );
      if (!isNaN(parseFloat(row.actual_package_length)))
        updateFields.actual_package_length = parseFloat(
          row.actual_package_length
        );
      if (!isNaN(parseFloat(row.actual_package_weight)))
        updateFields.actual_package_weight = parseFloat(
          row.actual_package_weight
        );
      if (!isNaN(parseFloat(row.actual_package_width)))
        updateFields.actual_package_width = parseFloat(
          row.actual_package_width
        );

      // Calculate actual_volumaric_weight only if all dimensions are valid
      if (
        !isNaN(row.actual_package_height) &&
        !isNaN(row.actual_package_length) &&
        !isNaN(row.actual_package_width)
      ) {
        updateFields.actual_volumaric_weight =
          (row.actual_package_length *
            row.actual_package_width *
            row.actual_package_height) /
          5000;
      }
      if (Object.keys(updateFields).length === 0) {
        console.warn(`Skipping row ${rowCount + 1}: No valid fields`);
        rowCount++;
        return;
      }

      updateFields.updatedAt = new Date();
      updateFields.package_details_edited_by = new mongoose.Types.ObjectId(
        userId
      );
      bulkOp.find({ master_sku: masterSku }).update({
        $set: updateFields,
      });

      count++;
      rowCount++;

      if (count === 1000 || rowCount === fileRecordLength) {
        stream.pause();
        try {
          await bulkOp.execute();
          bulkOp = db
            .collection('tbl_product_masters')
            .initializeUnorderedBulkOp();
          count = 0;
          stream.resume();
        } catch (bulkErr) {
          console.error('Bulk Update Error:', bulkErr);
          await fileStatusUpdate(fileName, 'FAILED');
          return reject({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error in bulk product update',
          });
        }
      }

      if (rowCount === fileRecordLength) {
        await fileStatusUpdate(fileName, 'COMPLETED');
      }
    });

    stream.on('end', async () => {
      try {
        if (count > 0) {
          await bulkOp.execute();
        }
        await fileStatusUpdate(fileName, 'PROCESSING');
        resolve({
          status: httpStatus.OK,
          message: 'Product update file processed successfully.',
        });
      } catch (endErr) {
        console.error('Final bulk error:', endErr);
        reject({
          status: httpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error during final update',
        });
      }
    });
  });

  try {
    return await productUpdateProcess;
  } catch (err) {
    console.error('processProductWeightUpdate Error:', err);
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: err?.message || 'Unknown error',
    };
  }
};

const processProductReferralFee = async (
  file,
  fileName,
  fileHeaders,
  fileRecordLength,
  fileUploadId,
  userId,
  storeId
) => {
  let count = 0,
    rowCount = 0,
    isCheck = false;
  let db = mongoose.connection;
  let bulkASBNItem = db
    .collection('tbl_amazon_referral_fees')
    .initializeOrderedBulkOp();

  const productLevelHSNBulk = new Promise((resolve, reject) => {
    let stream = fs
      .createReadStream(file)
      .pipe(csvParser({ separator: ',', skipEmptyLines: true }));
    stream.on('error', (error) => {
      console.error('File Read Error:', error);
      reject({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error reading the Referral fee file!',
      });
    });

    stream.on('data', async (row) => {
      if (Object.values(row).every((value) => value.trim() === '')) {
        console.warn(`Skipping empty row ${rowCount + 1}`);
        return;
      }
      if (!isCheck) {
        const rowKeys = Object.keys(row).map((key) => key.trim().toLowerCase());
        const requiredKeys = fileHeaders.map((header) =>
          header.trim().toLowerCase()
        );
        const checkAllKeys = requiredKeys.every((key) => rowKeys.includes(key));

        if (!checkAllKeys) {
          const missingKeys = requiredKeys.filter(
            (key) => !rowKeys.includes(key)
          );
          isCheck = true;
          await fileStatusUpdate(fileName, 'FAILED', userId);
          return reject({
            status: httpStatus.BAD_REQUEST,
            message: `File headers are incorrect! Missing: ${missingKeys.join(
              ', '
            )}`,
          });
        }
      }
      isCheck = true;

      // Validate mandatory fields
      const mandatoryFields = ['Master SKU', 'Amazon Referral Fee'];
      const missingFields = mandatoryFields.filter(
        (field) => !row[field] || row[field].trim() === ''
      );
      if (missingFields.length > 0) {
        console.warn(
          `Skipping row ${rowCount + 1}: Missing fields - ${missingFields.join(
            ', '
          )}`
        );
        return;
      }

      const obj = {
        master_sku: row['Master SKU'].trim(),
        referral_fee: Number(row['Amazon Referral Fee']),
        import_from: 'file',
        file_upload_id: fileUploadId,
        updated_by: userId && new mongoose.Types.ObjectId(userId),
        updatedAt: new Date(),
      };

      bulkASBNItem
        .find({
          master_sku: row['Master SKU'].trim(),
          store_id: new mongoose.Types.ObjectId(storeId),
        })
        .upsert()
        .update({
          $set: obj,
          $setOnInsert: {
            createdAt: new Date(),
            created_by: userId && new mongoose.Types.ObjectId(userId),
          },
        });

      count++;
      rowCount++;
      if (count === 1000 || rowCount === fileRecordLength) {
        stream.pause();
        try {
          // In slot
          await bulkASBNItem.execute(async function (err) {
            if (err) throw err;
            bulkASBNItem = db
              .collection('tbl_amazon_referral_fees')
              .initializeOrderedBulkOp();
            count = 0;
          });
        } catch (error) {
          console.error('Error inserting shipment rates:', error);
          await fileStatusUpdate(fileName, 'FAILED', userId);
          return reject({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error inserting shipment rate data!',
          });
        }
        stream.resume();
      }
      if (rowCount === fileRecordLength) {
        await fileStatusUpdate(fileName, 'COMPLETED', userId);
      }
    });

    stream.on('end', async () => {
      await fileStatusUpdate(fileName, 'PROCESSING', userId);
      resolve({
        status: httpStatus.OK,
        message: 'Shipment rate file imported successfully!',
      });
    });
  });

  try {
    return await productLevelHSNBulk;
  } catch (err) {
    errorHandler.errorM({
      action_type: 'import-shipment-rate-file',
      error_data: err,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: err?.message ? err.message : err,
    };
  }
};

const importTrackingSheet = async (fileData, userId, data) => {
  try {
    let filename = fileData.path.split('/').pop();
    let picture = filename.replace('uploads\\', '');
    const file = path.join(
      __dirname,
      `/../../uploads/file-uploader/${picture}`
    );
    const fileBuffer = fs.readFileSync(`${file}`);
    const to_string = fileBuffer.toString();
    const split_lines = to_string.split('\n');
    let lenghLimit = split_lines.length - 2;

    if (!fs.existsSync(file)) {
      return {
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'File not found!',
      };
    }

    let fileToProcess = file;
    if (file.endsWith('.xls') || file.endsWith('.xlsx')) {
      try {
        fileToProcess = excelToCsv(file);
        let { data } = nodeXlsx.parse(fs.readFileSync(fileToProcess))[0];
        const filteredData = data.filter((row) =>
          row.some((cell) => cell !== null && cell.toString().trim() !== '')
        );

        lenghLimit = filteredData.length - 1;
      } catch (error) {
        fs.unlink(file, async function (err) {
          if (err) {
            console.err('error while REMOVE [File]');
          }
        });
        return {
          status: httpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error converting Excel file to CSV!',
        };
      }
    }

    if (lenghLimit > 25000) {
      fs.unlink(file, async function (err) {
        if (err) {
          console.err('error while REMOVE [File]');
        }
      });
      return {
        status: 400,
        message: 'Please import file with maximum 25000 items limit',
      };
    }
    const fileObj = {
      created_by: userId,
      file_origin_name: fileData.name,
      file_records: lenghLimit,
      file_type: 'Order tracking',
      mime_type: fileData.type,
      file_size: fileData.size,
      file_uploaded_status: 'FAILED',
      file_name: picture,
    };

    let fileUploadDoc = await FileUploadModel.create(fileObj);

    const fileHeaders = [
      'orderNumber',
      'sku',
      'poNumber',
      'website',
      'ccNumber',
      'sellerName',
      'sellerPrice',
      'sellerQty',
      'amzTrackingNo',
      'courierName',
      'fulFillQty',
      'INTrackingNo',
      'INCourier',
    ];

    let filResponse = await processTrackingFile(
      fileToProcess,
      picture,
      fileHeaders,
      lenghLimit,
      data,
      userId
    );

    let statusD =
      filResponse.status === httpStatus.BAD_REQUEST ? 'FAILED' : 'COMPLETED';
    await FileUploadModel.updateOne(
      { _id: fileUploadDoc._id },
      { $set: { file_uploaded_status: statusD, message: filResponse.message } }
    );

    fs.unlink(fileToProcess, (err) => {
      if (err) console.error(err);
    });

    return filResponse;
  } catch (error) {
    errorHandler.errorM({
      action_type: 'verify-file-while-import',
      error_data: error,
    });
    return {
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message,
    };
  }
};

const processTrackingFile = async (
  file,
  fileName,
  fileHeaders,
  fileRecordLength,
  bodyData,
  userId
) => {
  let rowCount = 0;
  let isHeaderChecked = false;
  const orderItemMap = new Map();

  return new Promise((resolve, reject) => {
    const stream = fs
      .createReadStream(file)
      .pipe(csvParser({ separator: ',', skipEmptyLines: true }));

    stream.on('error', async () => {
      await fileStatusUpdate(fileName, 'FAILED');
      return reject({
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error reading the file!',
      });
    });

    stream.on('data', async (row) => {
      stream.pause();

      try {
        if (!isHeaderChecked) {
          const rowKeys = Object.keys(row).map((k) => k.trim().toLowerCase());
          const requiredKeys = fileHeaders.map((k) => k.trim().toLowerCase());
          const missingKeys = requiredKeys.filter((k) => !rowKeys.includes(k));
          if (missingKeys.length > 0) {
            await fileStatusUpdate(fileName, 'FAILED', userId);
            return reject({
              status: httpStatus.BAD_REQUEST,
              message: `File headers are incorrect! Missing: ${missingKeys.join(
                ', '
              )}`,
            });
          }
          isHeaderChecked = true;
        }

        const mandatoryFields = [
          'orderNumber',
          'sku',
          'poNumber',
          'website',
          'ccNumber',
          'sellerName',
          'sellerPrice',
          'sellerQty',
        ];

        const missingFields = mandatoryFields.filter(
          (field) => !row[field]?.trim()
        );
        if (missingFields.length) {
          await fileStatusUpdate(fileName, 'FAILED', userId);
          return reject({
            status: httpStatus.BAD_REQUEST,
            message: `Missing fields at Row ${
              rowCount + 1
            }: ${missingFields.join(', ')}`,
          });
        }

        const key = `${row.orderNumber.trim()}|${row.sku.trim()}`;
        const sellerObj = {
          po_number: row.poNumber.trim(),
          website: row.website.trim(),
          credit_card_number: parseFloat(row.ccNumber) || 0,
          seller_name: row.sellerName.trim(),
          in_tracking_number: row.INTrackingNo.trim(),
          courier_name: row.INCourier.trim(),
          seller_price: parseFloat(row.sellerPrice) || 0,
          seller_quantity: parseFloat(row.sellerQty) || 0,
          tracking_details: [],
        };

        if (row.amzTrackingNo || row.courierName) {
          sellerObj.tracking_details.push({
            tracking_id: row.amzTrackingNo?.trim() || '',
            courier_name: row.courierName?.trim() || '',
            fulfill_quantity: parseFloat(row.fulFillQty) || 0,
          });
        }

        if (!orderItemMap.has(key)) {
          orderItemMap.set(key, []);
        }

        orderItemMap.get(key).push(sellerObj);
        rowCount++;
      } catch (error) {
        await fileStatusUpdate(fileName, 'FAILED', userId);
        return reject({
          status: httpStatus.INTERNAL_SERVER_ERROR,
          message: `Row ${rowCount + 1} processing error.`,
        });
      } finally {
        stream.resume();
      }
    });

    stream.on('end', async () => {
      await fileStatusUpdate(fileName, 'PROCESSING', userId);
      const bulkOps = [];

      for (const [key, sellers] of orderItemMap.entries()) {
        const [order_number, sku] = key.split('|');
        const existingData = await OrderItemModel.findOne({
          order_number,
          sku,
          order_item_status: { $nin: [9, 10, 11, 16, 17] },
        });
        if (!existingData) continue;

        const existingSellerDetails = existingData?.seller_details || [];
        const sellerDetailsAfterUpdate = [...existingSellerDetails]; // temp for computing totals

        for (const seller of sellers) {
          let transactionIds = [];
          const existingSeller = existingSellerDetails.find(
            (s) =>
              s.po_number === seller.po_number &&
              parseFloat(s.seller_price) === parseFloat(seller.seller_price)
          );

          const trackingDetails = [];
          const fileTrackingMap = new Map();

          // Step 1: Parse file tracking and build map
          if (Array.isArray(seller.tracking_details)) {
            for (const td of seller.tracking_details) {
              if (!td?.tracking_id) continue;
              fileTrackingMap.set(td.tracking_id, td);
            }
          }

          // Step 2: Start with DB tracking (preserve everything not in file)
          if (Array.isArray(existingSeller?.tracking_details)) {
            for (const existingTd of existingSeller.tracking_details) {
              if (!fileTrackingMap.has(existingTd.tracking_id)) {
                trackingDetails.push({ ...existingTd }); // keep untouched
              }
            }
          }

          // Step 3: Merge file tracking (override or add)
          for (const td of seller.tracking_details || []) {
            if (!td?.tracking_id) continue;

            const reference_number = `${existingData.order_item_id}#${td.fulfill_quantity}_${td.fulfill_quantity}`;
            const newTd = {
              ...td,
              reference_number,
              is_bombino_generated: false,
            };
            transactionIds.push({
              transactionId: '',
              carrierTrackingNumber: td.tracking_id,
              reference_number: reference_number,
            });
            trackingDetails.push(newTd); // override or insert
          }

          if (existingSeller) {
            const update = {
              updateOne: {
                filter: {
                  order_number,
                  sku,
                  'seller_details.po_number': seller.po_number,
                  'seller_details.seller_price': parseFloat(
                    seller.seller_price
                  ),
                },
                update: {
                  $set: {
                    purchase_account_id: mongoose.Types.ObjectId(
                      bodyData.purchase_account_id
                    ),
                    'seller_details.$.seller_quantity': seller.seller_quantity,
                    'seller_details.$.seller_name': seller.seller_name,
                    'seller_details.$.in_tracking_number':
                      seller.in_tracking_number,
                    'seller_details.$.courier_name': seller.courier_name,
                    'seller_details.$.credit_card_number':
                      seller.credit_card_number,
                    ...(trackingDetails.length > 0 && {
                      'seller_details.$.tracking_details': trackingDetails,
                    }),
                  },
                },
              },
            };
            bulkOps.push(update);

            // simulate updated sellerDetails array
            const updated = {
              ...existingSeller,
              seller_quantity: seller.seller_quantity,
              tracking_details: trackingDetails,
            };
            const index = sellerDetailsAfterUpdate.indexOf(existingSeller);
            if (index > -1) sellerDetailsAfterUpdate[index] = updated;
          } else {
            const newSeller = {
              ...seller,
              seller_price: parseFloat(seller.seller_price),
              seller_quantity: parseFloat(seller.seller_quantity),
              credit_card_number: parseFloat(seller.credit_card_number),
              ...(trackingDetails && trackingDetails.length > 0
                ? { tracking_details: trackingDetails }
                : {}),
              externalId: `${order_number}|${existingData.order_item_id}|${existingData.asin}`,
              shipment_status: seller.in_tracking_number ? 3 : 1, // Done
              order_process_date: new Date(),
              order_process_by: mongoose.Types.ObjectId(userId),
            };

            const pushUpdate = {
              updateOne: {
                filter: { order_number, sku },
                update: {
                  $set: {
                    purchase_account_id: mongoose.Types.ObjectId(
                      bodyData.purchase_account_id
                    ),
                  },
                  $push: { seller_details: newSeller },
                },
              },
            };
            bulkOps.push(pushUpdate);
            sellerDetailsAfterUpdate.push(newSeller);
            if (newSeller) {
              const existingCardData = await creditCardModel.findOne({
                card_number: 1234,
                status: { $ne: 2 },
              });
              if (!existingCardData) {
                return {
                  status: 400,
                  message: 'Card number is not valid',
                };
              }

              if (existingCardData) {
                await transactionModel.create({
                  store_id: mongoose.Types.ObjectId(existingData.store_id),
                  amount: newSeller.seller_price || 0,
                  other_comment: '',
                  order_number,
                  asin: existingData.asin,
                  credit_card_id: mongoose.Types.ObjectId(existingCardData._id),
                  po_number: newSeller.po_number,
                  created_by: mongoose.Types.ObjectId(userId),
                  status: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }
            }
          }

          if (transactionIds && transactionIds.length > 0) {
            await transactionModel.findOneAndUpdate(
              {
                order_number,
                po_number: seller.po_number,
                amount: seller.seller_price || 0,
                asin: existingData.asin,
              },
              {
                $set: { status: 1 },
                $push: { transactionIds: { $each: transactionIds } },
              },
              { new: true }
            );
          }
        }

        // Compute status logic based on final sellerDetailsAfterUpdate
        const totalSellerQuantity = sellerDetailsAfterUpdate.reduce(
          (sum, s) => sum + (parseFloat(s.seller_quantity) || 0),
          0
        );

        const totalFulfillQuantity = sellerDetailsAfterUpdate.reduce(
          (sum, s) => {
            if (Array.isArray(s.tracking_details)) {
              return (
                sum +
                s.tracking_details.reduce(
                  (ts, t) => ts + (parseFloat(t.fulfill_quantity) || 0),
                  0
                )
              );
            }
            return sum;
          },
          0
        );

        const hasInboundTracking = sellerDetailsAfterUpdate.some(
          (s) => s.in_tracking_number && s.courier_name
        );

        // Determine new status
        let newStatus = existingData.order_item_status;
        if (hasInboundTracking) {
          newStatus = 15; //Shipment
        } else if (totalFulfillQuantity === existingData.qty) {
          newStatus = 6;
        } else if (
          totalFulfillQuantity > 0 &&
          totalFulfillQuantity < existingData.qty
        ) {
          newStatus = 14;
        } else if (totalSellerQuantity === existingData.qty) {
          newStatus = 4;
        } else if (
          totalSellerQuantity > 0 &&
          totalSellerQuantity < existingData.qty
        ) {
          newStatus = 5;
        }

        if (newStatus !== existingData.order_item_status) {
          // Add to bulkOps
          bulkOps.push({
            updateOne: {
              filter: {
                order_number,
                order_item_id: existingData.order_item_id,
              },
              update: {
                $set: { order_item_status: newStatus },
                $push: {
                  order_history: {
                    $each: [
                      {
                        createdAt: new Date(),
                        message:
                          'order status change while import tracking file',
                        updated_by: mongoose.Types.ObjectId(userId),
                        previous_status: existingData.order_item_status,
                        current_status: newStatus,
                      },
                    ],
                  },
                },
              },
            },
          });
        }
      }

      try {
        if (bulkOps.length > 0) {
          await OrderItemModel.bulkWrite(bulkOps);
        }
        await fileStatusUpdate(fileName, 'COMPLETED', userId);
        return resolve({
          status: httpStatus.OK,
          message: 'File processed successfully!',
        });
      } catch (error) {
        await fileStatusUpdate(fileName, 'FAILED', userId);
        return reject({
          status: httpStatus.INTERNAL_SERVER_ERROR,
          message: 'Bulk operation failed!',
        });
      }
    });
  });
};

module.exports = {
  importSheet,
  verifyFile,
  excelToCsv,
  fileStatusUpdate,
  importTrackingSheet,
};
