import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';

/**
 * Error thrown when authentication is required but not provided or invalid.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCode.UNAUTHORIZED);
  }

  /**
   * Creates an UnauthorizedError for invalid credentials.
   */
  static invalidCredentials(): UnauthorizedError {
    return new UnauthorizedError('Invalid credentials');
  }

  /**
   * Creates an UnauthorizedError for expired tokens.
   */
  static tokenExpired(): UnauthorizedError {
    return new UnauthorizedError('Token has expired');
  }

  /**
   * Creates an UnauthorizedError for invalid tokens.
   */
  static invalidToken(): UnauthorizedError {
    return new UnauthorizedError('Invalid or malformed token');
  }
}
