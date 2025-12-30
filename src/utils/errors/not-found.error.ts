import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, ErrorCode.RESOURCE_NOT_FOUND, {
      resource,
      field: 'id',
      value: id,
    });
  }
}
