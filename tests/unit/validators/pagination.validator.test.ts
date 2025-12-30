import { paginationQuerySchema } from '../../../src/validators/pagination.validator';

describe('Pagination Validator', () => {
  describe('paginationQuerySchema', () => {
    it('should use default values when not provided', () => {
      const result = paginationQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should validate valid pagination options', () => {
      const validData = {
        page: '2',
        limit: '20',
        sortBy: 'updatedAt',
        sortOrder: 'asc',
      };

      const result = paginationQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('updatedAt');
        expect(result.data.sortOrder).toBe('asc');
      }
    });

    it('should reject page less than 1', () => {
      const invalidData = { page: '0' };

      const result = paginationQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const invalidData = { limit: '101' };

      const result = paginationQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sortBy', () => {
      const invalidData = { sortBy: 'invalidField' };

      const result = paginationQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sortOrder', () => {
      const invalidData = { sortOrder: 'random' };

      const result = paginationQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
