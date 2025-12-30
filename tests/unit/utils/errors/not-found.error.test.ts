import { NotFoundError } from '../../../../src/utils/errors/not-found.error';
import { AppError } from '../../../../src/utils/errors/app-error';
import { ErrorCode } from '../../../../src/utils/errors/error-codes';

describe('NotFoundError', () => {
  it('should create error with resource and id', () => {
    const error = new NotFoundError('Comment', '123');

    expect(error.message).toBe('Comment with id 123 not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
  });

  it('should include context with resource info', () => {
    const error = new NotFoundError('Comment', '123');

    expect(error.context).toEqual({
      resource: 'Comment',
      field: 'id',
      value: '123',
    });
  });

  it('should be instance of AppError', () => {
    const error = new NotFoundError('User', 'abc');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NotFoundError);
  });

  it('should have proper prototype chain', () => {
    const error = new NotFoundError('Resource', 'id');

    expect(Object.getPrototypeOf(error)).toBe(NotFoundError.prototype);
  });

  it('should have isOperational set to true', () => {
    const error = new NotFoundError('Comment', '123');

    expect(error.isOperational).toBe(true);
  });

  it('should format different resource types correctly', () => {
    const commentError = new NotFoundError('Comment', '1');
    const userError = new NotFoundError('User', '2');
    const postError = new NotFoundError('Post', '3');

    expect(commentError.message).toBe('Comment with id 1 not found');
    expect(userError.message).toBe('User with id 2 not found');
    expect(postError.message).toBe('Post with id 3 not found');
  });

  it('should handle UUID ids', () => {
    const error = new NotFoundError('Comment', '123e4567-e89b-12d3-a456-426614174000');

    expect(error.message).toBe('Comment with id 123e4567-e89b-12d3-a456-426614174000 not found');
  });

  it('should have timestamp', () => {
    const before = new Date();
    const error = new NotFoundError('Comment', '123');
    const after = new Date();

    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
