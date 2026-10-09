// @ts-nocheck
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const fs = require('fs');
const { createResponse } = require('../../services/common.service');

class ExcelImporter {
  constructor(filePath, sheetName = null) {
    this.filePath = filePath;
    this.sheetName = sheetName;
    this.batchSize = 1000; // Adjust based on your system's capabilities
  }

  parseExcelFile() {
    // Check if file exists
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`Excel file not found at path: ${this.filePath}`);
    }

    try {
      // Read the workbook
      const workbook = XLSX.readFile(this.filePath);

      // Validate sheet name
      if (this.sheetName && !workbook.SheetNames.includes(this.sheetName)) {
        throw new Error(`Sheet "${this.sheetName}" not found in workbook`);
      }

      // If no sheet name provided, use the first sheet
      const sheetName = this.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Unable to read worksheet "${sheetName}"`);
      }

      // Convert worksheet to JSON
      return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  async processExcel() {
    try {
      // Parse Excel file
      const excelData = await this.parseExcelFile();
      // Process data in batches
      for (let i = 0; i < excelData.length; i += this.batchSize) {
        const batch = excelData.slice(i, i + this.batchSize);

        // Use Promise.all for concurrent processing of batch
        await Promise.all(
          batch.map(async (row) => {
            try {
              // Extract and transform data
              const skuData = {
                serial_no: row['Master SKU'],
                sku: row['CP Listing SKU'],
                product_id: row['Purchase Code'],
                lob: row['LOB'],
                stock: row['CP'],
                cpipl: row['CPIPL'],
                master_qty: row['In stock Qty'],
                avg_valuation: row['Avg.Valuation'],
                valuation: row['Valuation'],
                qty_remaining: row['Qty Remaining'],
                month: row['MONTH'],
                new_month: row['New Months'],
                createdAt: new Date(),
              };

              const stockData = {
                asin: row['Purchase Code'],
                product_name: row['Title'],
                main_category: row['First Category'],
                last_category: row['Last Category'],
                createdAt: new Date(),
              };

              // Upsert SKU (insert or update)
              if (skuData.sku) {
                await mongoose.connection
                  .collection('tbl_sku_masters')
                  .updateOne(
                    { sku: skuData.sku },
                    { $set: skuData },
                    { upsert: true }
                  );
              } else {
                console.warn(
                  'Skipping SKU update due to missing SKU value:',
                  skuData
                );
              }
              if (stockData.asin) {
                await mongoose.connection
                  .collection('tbl_product_masters')
                  .updateOne(
                    { asin: stockData.asin },
                    { $set: stockData },
                    { upsert: true }
                  );
              } else {
                console.warn(
                  'Skipping Product update due to missing ASIN value:',
                  stockData
                );
              }
            } catch (rowError) {
              console.error('Error processing row:', rowError);
            }
          })
        );
      }
    } catch (error) {
      console.error('Excel import error:', error);
    } finally {
      await mongoose.connection.close();
    }
  }

  // Additional method to extract sheet names
  getSheetNames() {
    const workbook = XLSX.readFile(this.filePath);
    return workbook.SheetNames;
  }
}

async function runImport() {
  try {
    const importer = new ExcelImporter(
      `${__dirname}/../../assets/stock-data_Worksheet_.xlsx`,
      'Sheet1'
    );
    // Option 1: Standard processing

    await importer.processExcel();
    return createResponse(httpStatus.OK, 'Data inserted successfully');

    // Optional: List sheet names
  } catch (error) {
    console.error('Import failed:', error);
    return {
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    };
  }
}

module.exports = { runImport };
