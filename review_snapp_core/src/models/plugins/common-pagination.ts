// @ts-nocheck
// Common function for

const paginationOprator = (options) => {
  // Sorting by operation, first name and last name
  let sort = {};
  if (options.sortBy) {
    let [key, order] = options.sortBy.split(':');
    if (key === 'first_name' || key === 'last_name') {
      key = `userDetails.${key}`;
    }
    if (key === 'role_name') {
      key = `role.${key}`;
    }
    sort = { [key]: order === 'desc' ? -1 : 1 };
  }

  // PAGINATION
  const limit =
    options.limit && parseInt(options.limit, 10) > 0
      ? parseInt(options.limit, 10)
      : 10;
  const page =
    options.page && parseInt(options.page, 10) > 0
      ? parseInt(options.page, 10)
      : 1;
  const skip = (page - 1) * limit;

  return {
    limit,
    page,
    skip,
    sort,
  };
};

module.exports = {
  paginationOprator,
};
