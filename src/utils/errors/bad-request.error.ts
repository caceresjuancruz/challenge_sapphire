import { AppError, ErrorContext } from './app-error.js';
import { ErrorCode } from './error-codes.js';

/**
 * Error thrown when the request is malformed or invalid.
 */
export class BadRequestError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.BAD_REQUEST, context);
  }

  /**
   * Creates a BadRequestError for missing required fields.
   */
  static missingField(field: string): BadRequestError {
    return new BadRequestError(`Missing required field: ${field}`, { field });
  }

  /**
   * Creates a BadRequestError for invalid field values.
   */
  static invalidField(field: string, reason: string): BadRequestError {
    return new BadRequestError(`Invalid ${field}: ${reason}`, { field, reason });
  }
}
