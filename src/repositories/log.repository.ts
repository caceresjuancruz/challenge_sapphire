import { injectable } from 'inversify';
import { ILogRepository } from './interfaces/log.repository.interface.js';
import { LogEntry, LogFilter, LogLevelValue } from '../services/logger/logger.types.js';

/**
 * In-memory repository for storing log entries.
 */
@injectable()
export class LogRepository implements ILogRepository {
  private logs: LogEntry[] = [];
  private readonly maxLogs: number = 1000;

  /**
   * Save a log entry to storage.
   * Implements circular buffer behavior when max capacity is reached.
   */
  save(entry: LogEntry): void {
    this.logs.push(entry);

    // Remove oldest logs if we exceed max capacity
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Find all log entries with optional filter.
   */
  findAll(filter?: LogFilter): LogEntry[] {
    let result = [...this.logs];

    if (filter) {
      // Filter by log level
      if (filter.level) {
        const minLevel = LogLevelValue[filter.level];
        result = result.filter((log) => LogLevelValue[log.level] >= minLevel);
      }

      // Filter by start date
      if (filter.startDate) {
        result = result.filter((log) => log.timestamp >= filter.startDate!);
      }

      // Filter by end date
      if (filter.endDate) {
        result = result.filter((log) => log.timestamp <= filter.endDate!);
      }

      // Filter by search term in message
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        result = result.filter((log) => log.message.toLowerCase().includes(searchLower));
      }

      // Apply limit
      if (filter.limit && filter.limit > 0) {
        result = result.slice(-filter.limit);
      }
    }

    // Return in reverse chronological order (newest first)
    return result.reverse();
  }

  /**
   * Get the count of stored logs.
   */
  count(): number {
    return this.logs.length;
  }

  /**
   * Clear all logs from storage.
   */
  clear(): void {
    this.logs = [];
  }
}
