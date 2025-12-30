import {
  PaginationOptions,
  PaginatedResult,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  DEFAULT_SORT_ORDER,
} from './pagination.types.js';

export function paginate<T>(
  items: T[],
  options: PaginationOptions,
  sortKeyExtractor?: (item: T) => Date | number | string
): PaginatedResult<T> {
  const page = options.page || DEFAULT_PAGE;
  const limit = options.limit || DEFAULT_LIMIT;
  const sortOrder = options.sortOrder || DEFAULT_SORT_ORDER;

  const sortedItems = [...items];

  if (sortKeyExtractor) {
    sortedItems.sort((a, b) => {
      const aValue = sortKeyExtractor(a);
      const bValue = sortKeyExtractor(b);

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const total = sortedItems.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedData = sortedItems.slice(offset, offset + limit);

  return {
    data: paginatedData,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
