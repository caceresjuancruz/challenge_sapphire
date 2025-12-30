import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { ErrorHandlerMiddleware } from '../../../src/middleware/error-handler.middleware';
import { AppError, ErrorCode, NotFoundError, ValidationError } from '../../../src/utils/errors';
import { ILoggerService } from '../../../src/services/logger/logger.service.interface';

describe('ErrorHandlerMiddleware', () => {
  let errorHandlerMiddleware: ErrorHandlerMiddleware;
  let mockLogger: jest.Mocked<ILoggerService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      logRequest: jest.fn(),
      logResponse: jest.fn(),
      logError: jest.fn(),
      getLogs: jest.fn(),
      clearLogs: jest.fn(),
    };

    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });

    mockRequest = {
      path: '/test-path',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn(),
    };

    mockResponse = {
      status: statusSpy,
    };

    mockNext = jest.fn();
    errorHandlerMiddleware = new ErrorHandlerMiddleware(mockLogger);
  });

  describe('handle', () => {
    it('should handle AppError with correct status and message', () => {
      const error = new AppError('Custom error message', ErrorCode.BAD_REQUEST);
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Custom error message',
            code: ErrorCode.BAD_REQUEST,
            statusCode: 400,
          }),
          path: '/test-path',
        })
      );
    });

    it('should handle NotFoundError correctly', () => {
      const error = new NotFoundError('Comment', '123');
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Comment with id 123 not found',
            code: ErrorCode.RESOURCE_NOT_FOUND,
            statusCode: 404,
          }),
        })
      );
    });

    it('should handle ValidationError correctly', () => {
      const error = new ValidationError([{ field: 'email', message: 'Invalid email format' }]);
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR,
            statusCode: 400,
          }),
        })
      );
    });

    it('should handle generic Error with 500 status', () => {
      const error = new Error('Something went wrong');
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      // In non-production, original error message is passed through
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Something went wrong',
            code: ErrorCode.INTERNAL_ERROR,
            statusCode: 500,
          }),
        })
      );
    });

    it('should include timestamp in response', () => {
      const error = new AppError('Test', ErrorCode.BAD_REQUEST);
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });

    it('should include path in response', () => {
      mockRequest.path = '/api/v1/comments';
      const error = new AppError('Test', ErrorCode.BAD_REQUEST);
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/comments',
        })
      );
    });

    it('should log error using logger service', () => {
      const error = new Error('Test error');
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLogger.logError).toHaveBeenCalledWith(expect.any(AppError), mockRequest);
    });

    it('should include context in response for AppError with context', () => {
      const error = new AppError('Resource error', ErrorCode.BAD_REQUEST, {
        field: 'id',
        value: '123',
      });
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            context: expect.objectContaining({
              field: 'id',
              value: '123',
            }),
          }),
        })
      );
    });

    it('should include method in response', () => {
      mockRequest.method = 'POST';
      const error = new AppError('Test', ErrorCode.BAD_REQUEST);
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle JSON SyntaxError as BadRequest', () => {
      const error = new SyntaxError('Unexpected token');
      (error as unknown as { body: string }).body = '{ invalid json }';
      const handler = errorHandlerMiddleware.handle();

      handler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Invalid JSON in request body',
            code: ErrorCode.BAD_REQUEST,
          }),
        })
      );
    });
  });
});
