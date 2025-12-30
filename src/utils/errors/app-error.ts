import { ErrorCode, getHttpStatusForError } from './error-codes.js';

/**
 * Context information for an error.
 * Provides additional details for debugging and logging.
 */
export interface ErrorContext {
  resource?: string;
  field?: string;
  value?: unknown;
  [key: string]: unknown;
}

/**
 * Base error class for all application errors.
 * Extends native Error with additional properties for HTTP responses and logging.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly timestamp: Date;

  constructor(message: string, code: ErrorCode = ErrorCode.INTERNAL_ERROR, context?: ErrorContext) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = getHttpStatusForError(code);
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date();

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts the error to a JSON-serializable object.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}
