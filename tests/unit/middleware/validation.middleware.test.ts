import { Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../../../src/middleware/validation.middleware';
import { AppError } from '../../../src/utils/errors/app-error';

describe('validate middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('body validation', () => {
    const bodySchema = z.object({
      content: z.string().min(1).max(100),
      authorId: z.string().uuid(),
    });

    it('should call next() when body is valid', async () => {
      mockRequest.body = {
        content: 'Valid content',
        authorId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const middleware = validate(bodySchema, 'body');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should update req.body with parsed data', async () => {
      mockRequest.body = {
        content: 'Valid content',
        authorId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const middleware = validate(bodySchema, 'body');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        content: 'Valid content',
        authorId: '123e4567-e89b-12d3-a456-426614174000',
      });
    });

    it('should call next with AppError when body is invalid', async () => {
      mockRequest.body = {
        content: '',
        authorId: 'invalid-uuid',
      };

      const middleware = validate(bodySchema, 'body');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('query validation', () => {
    const querySchema = z.object({
      page: z.coerce.number().min(1).optional(),
      limit: z.coerce.number().min(1).max(100).optional(),
    });

    it('should set validatedQuery when query is valid', async () => {
      mockRequest.query = { page: '1', limit: '10' };

      const middleware = validate(querySchema, 'query');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.validatedQuery).toEqual({ page: 1, limit: 10 });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with error when query is invalid', async () => {
      mockRequest.query = { page: '-1' };

      const middleware = validate(querySchema, 'query');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('params validation', () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    it('should call next() when params are valid', async () => {
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validate(paramsSchema, 'params');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with error when params are invalid', async () => {
      mockRequest.params = { id: 'invalid-uuid' };

      const middleware = validate(paramsSchema, 'params');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('error handling', () => {
    it('should pass non-Zod errors to next', async () => {
      const errorSchema = {
        parseAsync: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      };

      const middleware = validate(errorSchema as unknown as z.ZodType, 'body');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0]).not.toBeInstanceOf(AppError);
    });
  });
});
