import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';

/**
 * Error thrown when there is a conflict with existing resources.
 * Common uses: duplicate entries, concurrent modification conflicts.
 */
export class ConflictError extends AppError {
  constructor(message: string, resource?: string, field?: string, value?: unknown) {
    super(message, ErrorCode.CONFLICT, {
      resource,
      field,
      value,
    });
  }

  /**
   * Creates a ConflictError for duplicate resource scenarios.
   */
  static duplicate(resource: string, field: string, value: unknown): ConflictError {
    return new ConflictError(
      `${resource} with ${field} '${String(value)}' already exists`,
      resource,
      field,
      value
    );
  }
}
