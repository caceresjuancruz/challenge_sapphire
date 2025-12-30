/**
 * Centralized error codes for the application.
 * All error codes follow UPPER_SNAKE_CASE convention.
 */
export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Business/Domain Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INVALID_OPERATION = 'INVALID_OPERATION',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
}

/**
 * Maps error codes to their corresponding HTTP status codes.
 */
export const ErrorHttpStatus: Record<ErrorCode, number> = {
  // Client Errors
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.UNPROCESSABLE_ENTITY]: 422,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,

  // Server Errors
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,

  // Business Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.INVALID_OPERATION]: 400,
  [ErrorCode.DUPLICATE_RESOURCE]: 409,
};

/**
 * Gets the HTTP status code for a given error code.
 * Returns 500 if the error code is not found.
 */
export function getHttpStatusForError(code: ErrorCode): number {
  return ErrorHttpStatus[code] ?? 500;
}
