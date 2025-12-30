import { Request, Response } from 'express';
import { LogEntry, LogFilter } from './logger.types.js';

/**
 * Logger service interface.
 * Provides methods for logging messages at different levels
 * and accessing stored logs.
 */
export interface ILoggerService {
  /**
   * Log a debug message.
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * Log an info message.
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Log a warning message.
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Log an error message with optional error object.
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void;

  /**
   * Log an incoming HTTP request.
   */
  logRequest(req: Request): void;

  /**
   * Log an HTTP response with duration.
   */
  logResponse(req: Request, res: Response, durationMs: number): void;

  /**
   * Log an error with request context.
   */
  logError(error: Error, req?: Request): void;

  /**
   * Get logs from memory with optional filter.
   */
  getLogs(filter?: LogFilter): LogEntry[];

  /**
   * Clear all logs from memory.
   */
  clearLogs(): void;
}
