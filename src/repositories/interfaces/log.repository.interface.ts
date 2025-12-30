import { LogEntry, LogFilter } from '../../services/logger/logger.types.js';

/**
 * Repository interface for storing and retrieving log entries.
 */
export interface ILogRepository {
  /**
   * Save a log entry to storage.
   */
  save(entry: LogEntry): void;

  /**
   * Find all log entries with optional filter.
   */
  findAll(filter?: LogFilter): LogEntry[];

  /**
   * Get the count of stored logs.
   */
  count(): number;

  /**
   * Clear all logs from storage.
   */
  clear(): void;
}
