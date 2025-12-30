import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TYPES } from '../../config/types.js';
import { ILogRepository } from '../../repositories/interfaces/log.repository.interface.js';
import { ILoggerService } from './logger.service.interface.js';
import { LogEntry, LogFilter, LogLevel, LogErrorInfo, LogRequestInfo } from './logger.types.js';
import { AppError } from '../../utils/errors/index.js';

/**
 * ANSI color codes for console output.
 */
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
} as const;

/**
 * Options for the internal log method.
 */
interface LogOptions {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: LogErrorInfo;
  request?: LogRequestInfo;
}

/**
 * Logger service implementation.
 * Provides structured logging with console output and in-memory storage.
 */
@injectable()
export class LoggerService implements ILoggerService {
  constructor(
    @inject(TYPES.LogRepository)
    private readonly logRepository: ILogRepository
  ) {}

  /**
   * Log a debug message.
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log({ level: LogLevel.DEBUG, message, context });
  }

  /**
   * Log an info message.
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log({ level: LogLevel.INFO, message, context });
  }

  /**
   * Log a warning message.
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log({ level: LogLevel.WARN, message, context });
  }

  /**
   * Log an error message with optional error object.
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorInfo = error ? this.extractErrorInfo(error) : undefined;
    this.log({ level: LogLevel.ERROR, message, context, error: errorInfo });
  }

  /**
   * Log an incoming HTTP request.
   */
  logRequest(req: Request): void {
    const requestInfo = this.extractRequestInfo(req);
    this.log({
      level: LogLevel.INFO,
      message: `→ ${req.method} ${req.path}`,
      request: requestInfo,
    });
  }

  /**
   * Log an HTTP response with duration.
   */
  logResponse(req: Request, res: Response, durationMs: number): void {
    const requestInfo = this.extractRequestInfo(req);
    const statusColor = this.getStatusColor(res.statusCode);

    this.log({
      level: LogLevel.INFO,
      message: `← ${req.method} ${req.path} ${statusColor}${res.statusCode}${Colors.reset} ${durationMs}ms`,
      context: { statusCode: res.statusCode, duration: durationMs },
      request: requestInfo,
    });
  }

  /**
   * Log an error with request context.
   */
  logError(error: Error, req?: Request): void {
    const errorInfo = this.extractErrorInfo(error);
    const requestInfo = req ? this.extractRequestInfo(req) : undefined;

    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const code = error instanceof AppError ? error.code : 'INTERNAL_ERROR';

    this.log({
      level: LogLevel.ERROR,
      message: `[${code}] ${error.message}`,
      context: { statusCode },
      error: errorInfo,
      request: requestInfo,
    });
  }

  /**
   * Get logs from memory with optional filter.
   */
  getLogs(filter?: LogFilter): LogEntry[] {
    return this.logRepository.findAll(filter);
  }

  /**
   * Clear all logs from memory.
   */
  clearLogs(): void {
    this.logRepository.clear();
  }

  /**
   * Core logging method.
   */
  private log(options: LogOptions): void {
    const { level, message, context, error, request } = options;

    const entry: LogEntry = {
      id: uuidv4(),
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      request,
    };

    // Save to repository
    this.logRepository.save(entry);

    // Output to console
    this.writeToConsole(entry);
  }

  /**
   * Write log entry to console with formatting.
   * Skipped in production environment.
   */
  private writeToConsole(entry: LogEntry): void {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const timestamp = entry.timestamp.toISOString();
    const levelStr = this.formatLevel(entry.level);
    const prefix = `${Colors.gray}[${timestamp}]${Colors.reset} ${levelStr}`;

    const output = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(output);
        if (entry.error?.stack) {
          console.error(`${Colors.dim}${entry.error.stack}${Colors.reset}`);
        }
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.DEBUG:
        console.info(output);
        break;
      default:
        console.info(output);
    }

    // Log context if present and not empty
    if (entry.context && Object.keys(entry.context).length > 0) {
      console.info(`${Colors.dim}  Context: ${JSON.stringify(entry.context)}${Colors.reset}`);
    }
  }

  /**
   * Format log level with color.
   */
  private formatLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return `${Colors.magenta}[DEBUG]${Colors.reset}`;
      case LogLevel.INFO:
        return `${Colors.blue}[INFO]${Colors.reset} `;
      case LogLevel.WARN:
        return `${Colors.yellow}[WARN]${Colors.reset} `;
      case LogLevel.ERROR:
        return `${Colors.red}[ERROR]${Colors.reset}`;
    }
  }

  /**
   * Get color for HTTP status code.
   */
  private getStatusColor(statusCode: number): string {
    if (statusCode >= 500) return Colors.red;
    if (statusCode >= 400) return Colors.yellow;
    if (statusCode >= 300) return Colors.cyan;
    if (statusCode >= 200) return Colors.green;
    return Colors.gray;
  }

  /**
   * Extract error information for logging.
   */
  private extractErrorInfo(error: Error): LogErrorInfo {
    const info: LogErrorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    if (error instanceof AppError) {
      info.code = error.code;
    }

    return info;
  }

  /**
   * Extract request information for logging.
   */
  private extractRequestInfo(req: Request): LogRequestInfo {
    return {
      method: req.method,
      path: req.path,
      ip: req.ip ?? req.socket?.remoteAddress,
      userAgent: req.get('user-agent'),
      requestId: req.get('x-request-id'),
    };
  }
}
