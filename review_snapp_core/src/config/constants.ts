// @ts-nocheck
const uploadFileTypes = [
  { key: 'Shipment Rate', value: 1, slug_value: 'shipment_rate' },
  { key: 'HSN', value: 2, slug_value: 'hsn' },
  {
    key: 'Product Referral Fee',
    value: 3,
    slug_value: 'product_based_referral_fee',
  },
  { key: 'Product Based Hsn', value: 4, slug_value: 'product_based_hsn' },
  { key: 'Load ASIN', value: 5, slug_value: 'load_asin' },
  {
    key: 'Update Product Weight',
    value: 6,
    slug_value: 'update_product_weight',
  },
];

const randomTokenGenerator = (length) => {
  let result = '';
  let characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
/* Converting a weight value from kilograms to pounds. */
const kgToLbs = (weightInKg) => {
  const kgToLbsConversionFactor = 2.20462; // 1 kilogram is approximately equal to 2.20462 pounds
  const weightInLbs = weightInKg * kgToLbsConversionFactor;
  return weightInLbs;
};

const lbsToKg = (weightInLbs) => {
  const lbsToKgConversionFactor = 0.453592; // 1 pound is approximately equal to 0.453592 kilograms
  const weightInKg = Number(weightInLbs) * lbsToKgConversionFactor;
  return weightInKg;
};
const generateRandomDigits = (length) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
};

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  return `IN-${year}-${generateRandomDigits(8)}`;
};

function generateRandomAmazonOrderNumber() {
  const token = `FBB-${generateRandomDigits(7)}-${generateRandomDigits(7)}`;
  return token;
}

const convertToGrams = (weight) => {
  if (!weight) return 0; // Return 0 if weight doesn't exist or is falsy
  const match = weight.match(/^(\d+(\.\d+)?)\s*(\w+)$/i); // Match value and unit
  if (!match) return 0; // Return "N/A" if format is incorrect

  const value = parseFloat(match[1]);
  const unit = match[3].toLowerCase();

  switch (unit) {
    case 'g':
    case 'grams':
      return value; // Already in grams
    case 'ounces':
      return value * 28.3495; // Convert ounces to grams
    case 'kilograms':
      return value * 1000; // Convert kilograms to grams
    case 'pounds':
      return value * 453.592; // Convert pounds to grams
    case 'hundredths':
      return (value / 100) * 453.592; // Convert hundredths of pounds to grams
    case 'milligrams':
      return value / 1000; // Convert milligrams to grams
    default:
      return 0; // If unknown unit, return "N/A"
  }
};

const excelColumnHeaders = {
  ASIN: { header: 'ASIN', key: 'ASIN', width: 20 },
  price: { header: 'Price', key: 'price', width: 10 },
  stock: { header: 'Stock', key: 'stock', width: 10 },
  current_price: {
    header: 'Current Price',
    key: 'current_price',
    width: 15,
  },
  minimum_price: {
    header: 'Minimum Price',
    key: 'minimum_price',
    width: 15,
  },
  maximum_price: {
    header: 'Maximum Price',
    key: 'maximum_price',
    width: 15,
  },
  amazon_in_price: {
    header: 'Amazon In Price',
    key: 'amazon_in_price',
    width: 15,
  },
  buy_box_price: {
    header: 'BUY BOX PRICE',
    key: 'buy_box_price',
    width: 15,
  }, // Distinct key for BUY BOX PRICE
  weight: { header: 'Weight', key: 'weight', width: 15 },
  package_weight: {
    header: 'Package Weight',
    key: 'package_weight',
    width: 15,
  },
  fulfillment_channels: {
    header: 'Fulfillment Channel Code (US)',
    key: 'fulfillment_channels',
    width: 15,
  },
  difference: { header: 'Difference', key: 'difference', width: 15 }, // Add Difference column
};

const csvColumnHeaders = {
  ASIN: { title: 'ASIN', id: 'ASIN' },
  title: { title: 'Title', id: 'title' },
  brand: { title: 'Brand', id: 'brand' },
  category: { title: 'Category', id: 'category' },
  link: { title: 'Link', id: 'link' },
  price: { title: 'Price', id: 'price' },
  stock: { title: 'Stock', id: 'stock' },
  current_price: { title: 'Current Price', id: 'current_price' },
  minimum_price: { title: 'Minimum Price', id: 'minimum_price' },
  maximum_price: { title: 'Maximum Price', id: 'maximum_price' },
  amazon_in_price: { title: 'Amazon In Price', id: 'amazon_in_price' },
  weight: { title: 'Weight', id: 'weight' },
  package_weight: { title: 'Package Weight', id: 'package_weight' },
  final_result: { title: 'Result', id: 'final_result' },
};

const generateMathPipeline = (firstValue, secondValue, selectedOperator) => {
  if (!firstValue || !secondValue || !selectedOperator) {
    return [];
  }

  return [
    {
      $addFields: {
        final_result: {
          $switch: {
            branches: [
              {
                case: { $eq: [selectedOperator, 'plus'] },
                then: { $add: [`$${firstValue}`, `$${secondValue}`] }, // Add
              },
              {
                case: { $eq: [selectedOperator, 'minus'] },
                then: { $subtract: [`$${firstValue}`, `$${secondValue}`] }, // Subtract
              },
              {
                case: { $eq: [selectedOperator, 'multiply'] },
                then: { $multiply: [`$${firstValue}`, `$${secondValue}`] }, // Multiply
              },
              {
                case: { $eq: [selectedOperator, 'divide'] },
                then: { $divide: [`$${firstValue}`, `$${secondValue}`] }, // Divide
              },
              {
                case: { $eq: [selectedOperator, 'percentage'] },
                then: {
                  $multiply: [
                    { $divide: [`$${firstValue}`, 100] },
                    `$${secondValue}`,
                  ],
                }, // Percentage
              },
            ],
            default: null, // Default if no match
          },
        },
      },
    },
    {
      $addFields: {
        final_result: {
          $cond: {
            if: { $eq: ['$final_result', null] },
            then: null,
            else: {
              $round: [{ $ifNull: ['$final_result', 0] }, 2], // Round to 2 decimal places
            },
          },
        },
      },
    },
  ];
};

const generateWinningPriceFilter = (winning_price) => {
  return {
    $expr: {
      $and: [
        {
          $not: { $in: ['$current_price', [null, '']] },
        },
        {
          $not: { $in: ['$minimum_price', [null, '']] },
        },
        {
          $cond: {
            if: { $eq: [winning_price, true] },
            then: {
              $gt: [
                { $ifNull: ['$current_price', 0] },
                { $ifNull: ['$minimum_price', 0] },
              ],
            },
            else: {
              $lt: [
                { $ifNull: ['$current_price', 0] },
                { $ifNull: ['$minimum_price', 0] },
              ],
            },
          },
        },
      ],
    },
  };
};

const storeKeyToDbNameMap = {
  'db661bfa-d01d-4540-b84b-d2a6ab1f9531': 'tbl_usa_inventories',
  'da66c2ff-c451-4a30-981e-52374ef401ed': 'tbl_canada_inventories', // Add other mappings as needed
};

// ASIN Validation Regex (10-character alphanumeric, uppercase letters and numbers)
const asinRegex = /^[A-Z0-9]{10}$/;

const createSearchRegex = (keyword) => {
  if (!keyword || typeof keyword !== 'string') {
    console.error('Invalid keyword provided:', keyword);
    return null; // Return null or a default regex if needed
  }

  // Normalize the keyword: trim spaces and convert to lowercase
  const normalizedKeyword = keyword.trim().toLowerCase();

  // Split the keyword into individual words
  const words = normalizedKeyword
    .split(/\s+/) // Split by spaces for multi-word keywords
    .map((word) => word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')); // Escape special regex characters

  // Build the regex pattern to match each word in any order with flexible spaces
  const regexPattern = words
    .map((word) => `(?=.*\\b${word}s?\\b)`) // Match each word, allowing an optional plural 's'
    .join(''); // Concatenate patterns to ensure all words are matched

  // Return the constructed regex with the case-insensitive flag
  return new RegExp(regexPattern, 'i');
};

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

const orderItemStatus = [
  { key: 0, value: 'Waiting', color: 'orange' },
  { key: 1, value: 'Pending', color: 'black' },
  { key: 2, value: 'Active', color: 'purple' },
  { key: 3, value: 'Allocated', color: 'amber' },
  { key: 4, value: 'Processing', color: 'green' },
  { key: 5, value: 'Part. Process', color: 'sky' },
  { key: 6, value: 'Backorder', color: 'pink' },
  { key: 7, value: 'Picklist', color: 'pink' },
  { key: 8, value: 'Paused', color: 'yellow' },
  { key: 9, value: 'Dispatched', color: 'blue' },
  { key: 10, value: 'Delivered', color: 'violet' },
  { key: 11, value: 'Cancelled', color: 'red' },
  { key: 12, value: 'History', color: 'gray' },
  { key: 13, value: 'Removal', color: 'rose' },
  { key: 14, value: 'Incomplete', color: 'yellow' },
  { key: 15, value: 'Shipment', color: 'green' },
  { key: 16, value: 'Return', color: 'green' },
  { key: 17, value: 'Refund', color: 'green' },
];

const AMZ_ORDERING_PROCESS_STATUS = {
  bno: 1,
  cnm: 2,
  trs: 3,
  cno: 4,
  fbb: 5,
};
const role_ids = [
  { key: 'purchase_team', id: '683eafd3004dda1293abcb02' },
  { key: 'customer_support', id: '683ef5eaab190638297a15ce' },
  { key: 'management_team', id: '67dab3b921f205445468b05c' },
  { key: 'account_team', id: '683edfd6ab1906382979beb4' },
  { key: 'pld_team', id: '67ff500d76c7b015bbe245ad' },
];

const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
const statusMap = {
  0: 'Waiting',
  1: 'Pending',
  2: 'Active',
  3: 'Allocated',
  4: 'Processing',
  5: 'Part_Process',
  6: 'Backorder',
  7: 'Picklist',
  8: 'Paused',
  9: 'Dispatched',
  10: 'Delivered',
  11: 'Cancelled',
  12: 'History',
  13: 'Removal',
  14: 'Incomplete',
  15: 'Shipment',
  16: 'Return',
  17: 'Refund',
};

function getFormattedTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');

  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1); // Month is 0-based
  const yyyy = date.getFullYear();

  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${dd}${mm}${yyyy}_${hh}${min}${ss}`;
}

module.exports = {
  uploadFileTypes,
  randomTokenGenerator,
  kgToLbs,
  lbsToKg,
  generateRandomDigits,
  generateRandomAmazonOrderNumber,
  generateOrderNumber,
  convertToGrams,
  excelColumnHeaders,
  csvColumnHeaders,
  generateMathPipeline,
  generateWinningPriceFilter,
  storeKeyToDbNameMap,
  createSearchRegex,
  slugify,
  asinRegex,
  orderItemStatus,
  AMZ_ORDERING_PROCESS_STATUS,
  escapeRegex,
  role_ids,
  statusMap,
  getFormattedTimestamp,
};
