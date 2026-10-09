// @ts-nocheck
/**
 * Helper functions for EJS templates
 */

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

const formatCurrency = (amount) => {
  if (!amount) return 'N/A';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  } catch (error) {
    return 'N/A';
  }
};

const formatOrderItems = (items) => {
  if (!items || !Array.isArray(items)) return '0 items';
  return `${items.length} item${items.length !== 1 ? 's' : ''}`;
};

const getStatusClass = (status) => {
  if (!status) return 'pending';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('shipped')) return 'shipped';
  if (statusLower.includes('delivered')) return 'delivered';
  return 'pending';
};

const buildSearchUrl = (currentUrl, page) => {
  try {
    const url = new URL(currentUrl, 'http://localhost');
    url.searchParams.set('page', page);
    return url.pathname + url.search;
  } catch (error) {
    return `?page=${page}`;
  }
};

module.exports = {
  formatDate,
  formatCurrency,
  formatOrderItems,
  getStatusClass,
  buildSearchUrl,
};
