import { paginate } from '../../../../src/utils/pagination/pagination.helper';
import { PaginationOptions } from '../../../../src/utils/pagination/pagination.types';

describe('paginate', () => {
  const testItems = [
    { id: 1, name: 'Item 1', createdAt: new Date('2024-01-01') },
    { id: 2, name: 'Item 2', createdAt: new Date('2024-01-02') },
    { id: 3, name: 'Item 3', createdAt: new Date('2024-01-03') },
    { id: 4, name: 'Item 4', createdAt: new Date('2024-01-04') },
    { id: 5, name: 'Item 5', createdAt: new Date('2024-01-05') },
  ];

  describe('pagination', () => {
    it('should return first page with correct items', () => {
      const options: PaginationOptions = { page: 1, limit: 2 };
      const result = paginate(testItems, options);

      expect(result.data.length).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(2);
      expect(result.meta.total).toBe(5);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should return second page with correct items', () => {
      const options: PaginationOptions = { page: 2, limit: 2 };
      const result = paginate(testItems, options);

      expect(result.data.length).toBe(2);
      expect(result.data[0].id).toBe(3);
      expect(result.data[1].id).toBe(4);
    });

    it('should return last page with remaining items', () => {
      const options: PaginationOptions = { page: 3, limit: 2 };
      const result = paginate(testItems, options);

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe(5);
    });

    it('should return empty array for page beyond total', () => {
      const options: PaginationOptions = { page: 10, limit: 2 };
      const result = paginate(testItems, options);

      expect(result.data.length).toBe(0);
    });

    it('should use default values when not provided', () => {
      const options: PaginationOptions = { page: 0, limit: 0 };
      const result = paginate(testItems, options);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('hasNextPage and hasPrevPage', () => {
    it('should set hasNextPage true when more pages exist', () => {
      const options: PaginationOptions = { page: 1, limit: 2 };
      const result = paginate(testItems, options);

      expect(result.meta.hasNextPage).toBe(true);
    });

    it('should set hasNextPage false on last page', () => {
      const options: PaginationOptions = { page: 3, limit: 2 };
      const result = paginate(testItems, options);

      expect(result.meta.hasNextPage).toBe(false);
    });

    it('should set hasPrevPage false on first page', () => {
      const options: PaginationOptions = { page: 1, limit: 2 };
      const result = paginate(testItems, options);

      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should set hasPrevPage true on subsequent pages', () => {
      const options: PaginationOptions = { page: 2, limit: 2 };
      const result = paginate(testItems, options);

      expect(result.meta.hasPrevPage).toBe(true);
    });
  });

  describe('sorting', () => {
    it('should sort ascending when specified', () => {
      const options: PaginationOptions = { page: 1, limit: 10, sortOrder: 'asc' };
      const result = paginate(testItems, options, (item) => item.createdAt);

      expect(result.data[0].id).toBe(1);
      expect(result.data[4].id).toBe(5);
    });

    it('should sort descending when specified', () => {
      const options: PaginationOptions = { page: 1, limit: 10, sortOrder: 'desc' };
      const result = paginate(testItems, options, (item) => item.createdAt);

      expect(result.data[0].id).toBe(5);
      expect(result.data[4].id).toBe(1);
    });

    it('should use default desc order when not specified', () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      const result = paginate(testItems, options, (item) => item.createdAt);

      expect(result.data[0].id).toBe(5);
    });

    it('should not sort when no sortKeyExtractor provided', () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      const result = paginate(testItems, options);

      expect(result.data[0].id).toBe(1);
    });

    it('should handle sorting by numeric values', () => {
      const options: PaginationOptions = { page: 1, limit: 10, sortOrder: 'asc' };
      const result = paginate(testItems, options, (item) => item.id);

      expect(result.data[0].id).toBe(1);
      expect(result.data[4].id).toBe(5);
    });

    it('should handle sorting by string values', () => {
      const items = [
        { id: 1, name: 'Banana' },
        { id: 2, name: 'Apple' },
        { id: 3, name: 'Cherry' },
      ];
      const options: PaginationOptions = { page: 1, limit: 10, sortOrder: 'asc' };
      const result = paginate(items, options, (item) => item.name);

      expect(result.data[0].name).toBe('Apple');
      expect(result.data[1].name).toBe('Banana');
      expect(result.data[2].name).toBe('Cherry');
    });
  });

  describe('totalPages calculation', () => {
    it('should calculate totalPages correctly', () => {
      const options: PaginationOptions = { page: 1, limit: 2 };
      const result = paginate(testItems, options);

      expect(result.meta.totalPages).toBe(3);
    });

    it('should return 0 totalPages for empty array', () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      const result = paginate([], options);

      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.total).toBe(0);
    });

    it('should return 1 totalPage when items fit in one page', () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      const result = paginate(testItems, options);

      expect(result.meta.totalPages).toBe(1);
    });
  });
});
