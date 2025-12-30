import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types.js';
import { ILoggerService } from '../services/logger/logger.service.interface.js';
import { AppError, ErrorCode, ErrorContext } from '../utils/errors/index.js';

/**
 * Error response structure sent to clients.
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    context?: ErrorContext;
  };
  timestamp: string;
  path: string;
  method: string;
}

/**
 * Centralized error handling middleware.
 * Catches all errors, logs them, and sends standardized responses.
 */
@injectable()
export class ErrorHandlerMiddleware {
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: ILoggerService
  ) {}

  /**
   * Returns the Express error handler function.
   */
  handle(): ErrorRequestHandler {
    return (error: Error, req: Request, res: Response, _next: NextFunction): void => {
      // Normalize error to AppError
      const appError = this.normalizeError(error);

      // Log the error with full context
      this.logger.logError(appError, req);

      // Build and send response
      const response = this.buildErrorResponse(appError, req);
      res.status(appError.statusCode).json(response);
    };
  }

  /**
   * Normalizes any error to an AppError instance.
   */
  private normalizeError(error: Error): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Handle specific error types
    if (error.name === 'SyntaxError' && 'body' in error) {
      // JSON parse error
      return new AppError('Invalid JSON in request body', ErrorCode.BAD_REQUEST);
    }

    // Default: wrap as internal error
    return new AppError(
      process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
      ErrorCode.INTERNAL_ERROR
    );
  }

  /**
   * Builds the error response object.
   */
  private buildErrorResponse(error: AppError, req: Request): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    };

    // Include context in non-production environments or for client errors
    if (error.context && (process.env.NODE_ENV !== 'production' || error.statusCode < 500)) {
      response.error.context = error.context;
    }

    return response;
  }
}
