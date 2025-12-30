import { AppError } from '../../../../src/utils/errors/app-error';
import { ErrorCode } from '../../../../src/utils/errors/error-codes';

describe('AppError', () => {
  it('should create error with default values', () => {
    const error = new AppError('Test message');

    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.isOperational).toBe(true);
  });

  it('should create error with custom code', () => {
    const error = new AppError('Bad request', ErrorCode.BAD_REQUEST);

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.BAD_REQUEST);
  });

  it('should create error with context', () => {
    const context = { field: 'email', value: 'invalid' };
    const error = new AppError('Validation failed', ErrorCode.VALIDATION_ERROR, context);

    expect(error.context).toEqual(context);
  });

  it('should be instance of Error', () => {
    const error = new AppError('Test');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should have proper prototype chain', () => {
    const error = new AppError('Test');

    expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
  });

  it('should have stack trace', () => {
    const error = new AppError('Test');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('app-error.test.ts');
  });

  it('should have name property set to class name', () => {
    const error = new AppError('Test');

    expect(error.name).toBe('AppError');
  });

  it('should have timestamp', () => {
    const before = new Date();
    const error = new AppError('Test');
    const after = new Date();

    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should convert to JSON', () => {
    const error = new AppError('Test message', ErrorCode.BAD_REQUEST, { field: 'test' });
    const json = error.toJSON();

    expect(json.name).toBe('AppError');
    expect(json.message).toBe('Test message');
    expect(json.code).toBe(ErrorCode.BAD_REQUEST);
    expect(json.statusCode).toBe(400);
    expect(json.context).toEqual({ field: 'test' });
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });

  describe('different error codes', () => {
    it.each([
      [ErrorCode.BAD_REQUEST, 400],
      [ErrorCode.UNAUTHORIZED, 401],
      [ErrorCode.FORBIDDEN, 403],
      [ErrorCode.NOT_FOUND, 404],
      [ErrorCode.CONFLICT, 409],
      [ErrorCode.UNPROCESSABLE_ENTITY, 422],
      [ErrorCode.INTERNAL_ERROR, 500],
      [ErrorCode.RESOURCE_NOT_FOUND, 404],
      [ErrorCode.VALIDATION_ERROR, 400],
    ])('should create error with code %s and statusCode %i', (code, expectedStatus) => {
      const error = new AppError('Test', code);

      expect(error.code).toBe(code);
      expect(error.statusCode).toBe(expectedStatus);
    });
  });
});
