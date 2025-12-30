import {
  createCommentSchema,
  updateCommentSchema,
  idParamSchema,
} from '../../../src/validators/comment.validator';

describe('Comment Validators', () => {
  describe('createCommentSchema', () => {
    it('should validate valid comment data', () => {
      const validData = {
        content: 'This is a valid comment',
        authorId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = createCommentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const invalidData = {
        content: '',
        authorId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = createCommentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for authorId', () => {
      const invalidData = {
        content: 'Valid content',
        authorId: 'not-a-uuid',
      };

      const result = createCommentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject content exceeding max length', () => {
      const invalidData = {
        content: 'a'.repeat(5001),
        authorId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = createCommentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateCommentSchema', () => {
    it('should validate valid update data', () => {
      const validData = { content: 'Updated content' };

      const result = updateCommentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const invalidData = { content: '' };

      const result = updateCommentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('idParamSchema', () => {
    it('should validate valid UUID', () => {
      const validData = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const result = idParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = { id: 'not-a-uuid' };

      const result = idParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
