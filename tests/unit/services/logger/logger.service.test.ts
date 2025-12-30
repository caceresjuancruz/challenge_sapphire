import 'reflect-metadata';
import { LoggerService } from '../../../../src/services/logger/logger.service';
import { ILogRepository } from '../../../../src/repositories/interfaces/log.repository.interface';
import { LogLevel, LogEntry } from '../../../../src/services/logger/logger.types';
import { AppError, ErrorCode } from '../../../../src/utils/errors';
import { Request, Response } from 'express';

describe('LoggerService', () => {
  let loggerService: LoggerService;
  let mockLogRepository: jest.Mocked<ILogRepository>;

  beforeEach(() => {
    mockLogRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      clear: jest.fn(),
    };

    loggerService = new LoggerService(mockLogRepository);

    // Suppress console output in tests
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('debug', () => {
    it('should log debug message', () => {
      loggerService.debug('Debug message');

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.level).toBe(LogLevel.DEBUG);
      expect(savedEntry.message).toBe('Debug message');
    });

    it('should log debug message with context', () => {
      loggerService.debug('Debug message', { key: 'value' });

      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.context).toEqual({ key: 'value' });
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      loggerService.info('Info message');

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.level).toBe(LogLevel.INFO);
      expect(savedEntry.message).toBe('Info message');
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      loggerService.warn('Warning message');

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.level).toBe(LogLevel.WARN);
      expect(savedEntry.message).toBe('Warning message');
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      loggerService.error('Error message');

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.level).toBe(LogLevel.ERROR);
      expect(savedEntry.message).toBe('Error message');
    });

    it('should log error with Error object', () => {
      const error = new Error('Test error');
      loggerService.error('Error occurred', error);

      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.error).toBeDefined();
      expect(savedEntry.error?.name).toBe('Error');
      expect(savedEntry.error?.message).toBe('Test error');
      expect(savedEntry.error?.stack).toBeDefined();
    });

    it('should log error with AppError including code', () => {
      const error = new AppError('App error', ErrorCode.BAD_REQUEST);
      loggerService.error('Error occurred', error);

      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.error?.code).toBe(ErrorCode.BAD_REQUEST);
    });
  });

  describe('logRequest', () => {
    it('should log incoming request', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
      } as unknown as Request;

      loggerService.logRequest(mockReq);

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.level).toBe(LogLevel.INFO);
      expect(savedEntry.message).toContain('GET /api/test');
      expect(savedEntry.request?.method).toBe('GET');
      expect(savedEntry.request?.path).toBe('/api/test');
    });
  });

  describe('logResponse', () => {
    it('should log response with duration', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      } as unknown as Request;

      const mockRes = {
        statusCode: 200,
      } as unknown as Response;

      loggerService.logResponse(mockReq, mockRes, 50);

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.message).toContain('GET /api/test');
      expect(savedEntry.message).toContain('200');
      expect(savedEntry.message).toContain('50ms');
    });

    it('should handle 5xx status codes', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      } as unknown as Request;

      const mockRes = {
        statusCode: 500,
      } as unknown as Response;

      loggerService.logResponse(mockReq, mockRes, 100);

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle 4xx status codes', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      } as unknown as Request;

      const mockRes = {
        statusCode: 404,
      } as unknown as Response;

      loggerService.logResponse(mockReq, mockRes, 100);

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle 3xx status codes', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      } as unknown as Request;

      const mockRes = {
        statusCode: 301,
      } as unknown as Response;

      loggerService.logResponse(mockReq, mockRes, 100);

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle 1xx status codes', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      } as unknown as Request;

      const mockRes = {
        statusCode: 100,
      } as unknown as Response;

      loggerService.logResponse(mockReq, mockRes, 100);

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('logError', () => {
    it('should log error with request context', () => {
      const error = new AppError('Test error', ErrorCode.NOT_FOUND);
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
        get: jest.fn(),
      } as unknown as Request;

      loggerService.logError(error, mockReq);

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.level).toBe(LogLevel.ERROR);
      expect(savedEntry.request?.method).toBe('GET');
      expect(savedEntry.request?.path).toBe('/api/test');
    });

    it('should log error without request', () => {
      const error = new Error('Test error');

      loggerService.logError(error);

      expect(mockLogRepository.save).toHaveBeenCalledTimes(1);
      const savedEntry = mockLogRepository.save.mock.calls[0][0];
      expect(savedEntry.level).toBe(LogLevel.ERROR);
      expect(savedEntry.request).toBeUndefined();
    });
  });

  describe('getLogs', () => {
    it('should delegate to repository', () => {
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          level: LogLevel.INFO,
          message: 'Test',
          timestamp: new Date(),
        },
      ];
      mockLogRepository.findAll.mockReturnValue(mockLogs);

      const result = loggerService.getLogs();

      expect(mockLogRepository.findAll).toHaveBeenCalled();
      expect(result).toBe(mockLogs);
    });

    it('should pass filter to repository', () => {
      const filter = { level: LogLevel.ERROR, limit: 10 };

      loggerService.getLogs(filter);

      expect(mockLogRepository.findAll).toHaveBeenCalledWith(filter);
    });
  });

  describe('clearLogs', () => {
    it('should delegate to repository', () => {
      loggerService.clearLogs();

      expect(mockLogRepository.clear).toHaveBeenCalled();
    });
  });
});
