/**
 * Log severity levels.
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Numeric values for log levels (for comparison).
 */
export const LogLevelValue: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Error information in a log entry.
 */
export interface LogErrorInfo {
  name: string;
  message: string;
  code?: string;
  stack?: string;
}

/**
 * HTTP request information in a log entry.
 */
export interface LogRequestInfo {
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * A single log entry.
 */
export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: LogErrorInfo;
  request?: LogRequestInfo;
}

/**
 * Filter options for querying logs.
 */
export interface LogFilter {
  level?: LogLevel;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
}
