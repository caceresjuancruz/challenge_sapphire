import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';

/**
 * Error thrown when the user is authenticated but lacks permission for the action.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', resource?: string, action?: string) {
    super(message, ErrorCode.FORBIDDEN, {
      resource,
      action,
    });
  }

  /**
   * Creates a ForbiddenError for resource access denial.
   */
  static forResource(resource: string, action: string = 'access'): ForbiddenError {
    return new ForbiddenError(
      `You do not have permission to ${action} this ${resource}`,
      resource,
      action
    );
  }
}
