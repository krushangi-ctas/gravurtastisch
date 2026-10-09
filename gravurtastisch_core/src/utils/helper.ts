// @ts-nocheck
const slugify = require('slugify');

// Create a common slugifyOptions object
/* eslint-disable no-useless-escape */
const commonSlugifyOptions = {
  remove: /[`~!@#|$%^&*()+=,.\/?<>'"\:;_]/gi,
  replacement: '_',
  lower: true,
  strict: true,
};

// Custom slugify function using common options
const customSlug = (title) => slugify(title, commonSlugifyOptions);

module.exports = {
  customSlug,
};
