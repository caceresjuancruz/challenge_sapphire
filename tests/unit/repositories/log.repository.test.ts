import 'reflect-metadata';
import { LogRepository } from '../../../src/repositories/log.repository';
import { LogLevel, LogEntry } from '../../../src/services/logger/logger.types';

describe('LogRepository', () => {
  let repository: LogRepository;

  const createLogEntry = (overrides?: Partial<LogEntry>): LogEntry => ({
    id: 'test-id',
    level: LogLevel.INFO,
    message: 'Test message',
    timestamp: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    repository = new LogRepository();
  });

  describe('save', () => {
    it('should save a log entry', () => {
      const entry = createLogEntry();

      repository.save(entry);

      expect(repository.count()).toBe(1);
    });

    it('should save multiple log entries', () => {
      repository.save(createLogEntry({ id: '1' }));
      repository.save(createLogEntry({ id: '2' }));
      repository.save(createLogEntry({ id: '3' }));

      expect(repository.count()).toBe(3);
    });

    it('should maintain max logs limit', () => {
      // Save more than maxLogs (1000)
      for (let i = 0; i < 1005; i++) {
        repository.save(createLogEntry({ id: `log-${i}` }));
      }

      expect(repository.count()).toBe(1000);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no logs', () => {
      const result = repository.findAll();

      expect(result).toEqual([]);
    });

    it('should return all logs in reverse chronological order', () => {
      const entry1 = createLogEntry({ id: '1', timestamp: new Date('2024-01-01') });
      const entry2 = createLogEntry({ id: '2', timestamp: new Date('2024-01-02') });

      repository.save(entry1);
      repository.save(entry2);

      const result = repository.findAll();

      expect(result.length).toBe(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('1');
    });

    it('should filter by log level', () => {
      repository.save(createLogEntry({ id: '1', level: LogLevel.DEBUG }));
      repository.save(createLogEntry({ id: '2', level: LogLevel.INFO }));
      repository.save(createLogEntry({ id: '3', level: LogLevel.ERROR }));

      const result = repository.findAll({ level: LogLevel.INFO });

      // Should return INFO and ERROR (levels >= INFO)
      expect(result.length).toBe(2);
      expect(result.map((l) => l.level)).toContain(LogLevel.INFO);
      expect(result.map((l) => l.level)).toContain(LogLevel.ERROR);
    });

    it('should filter by start date', () => {
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-06-01');

      repository.save(createLogEntry({ id: '1', timestamp: oldDate }));
      repository.save(createLogEntry({ id: '2', timestamp: newDate }));

      const result = repository.findAll({ startDate: new Date('2024-03-01') });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter by end date', () => {
      const oldDate = new Date('2024-01-01');
      const newDate = new Date('2024-06-01');

      repository.save(createLogEntry({ id: '1', timestamp: oldDate }));
      repository.save(createLogEntry({ id: '2', timestamp: newDate }));

      const result = repository.findAll({ endDate: new Date('2024-03-01') });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter by search term', () => {
      repository.save(createLogEntry({ id: '1', message: 'Error processing request' }));
      repository.save(createLogEntry({ id: '2', message: 'Success' }));

      const result = repository.findAll({ search: 'error' });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('should apply limit', () => {
      repository.save(createLogEntry({ id: '1' }));
      repository.save(createLogEntry({ id: '2' }));
      repository.save(createLogEntry({ id: '3' }));

      const result = repository.findAll({ limit: 2 });

      expect(result.length).toBe(2);
    });
  });

  describe('count', () => {
    it('should return 0 for empty repository', () => {
      expect(repository.count()).toBe(0);
    });

    it('should return correct count', () => {
      repository.save(createLogEntry({ id: '1' }));
      repository.save(createLogEntry({ id: '2' }));

      expect(repository.count()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all logs', () => {
      repository.save(createLogEntry({ id: '1' }));
      repository.save(createLogEntry({ id: '2' }));

      repository.clear();

      expect(repository.count()).toBe(0);
      expect(repository.findAll()).toEqual([]);
    });
  });
});
