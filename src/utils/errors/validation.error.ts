import { AppError, ErrorContext } from './app-error.js';
import { ErrorCode } from './error-codes.js';

/**
 * Represents a single validation issue.
 */
export interface ValidationIssue {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends AppError {
  public readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[], message?: string) {
    const errorMessage =
      message ?? issues.map((issue) => `${issue.field}: ${issue.message}`).join(', ');

    const context: ErrorContext = {
      issues,
      fields: issues.map((issue) => issue.field),
    };

    super(errorMessage, ErrorCode.VALIDATION_ERROR, context);
    this.issues = issues;
  }

  /**
   * Creates a ValidationError from a single field error.
   */
  static fromField(field: string, message: string, value?: unknown): ValidationError {
    return new ValidationError([{ field, message, value }]);
  }
}
