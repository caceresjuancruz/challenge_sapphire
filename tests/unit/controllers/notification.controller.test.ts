import 'reflect-metadata';
import { Request, Response } from 'express';
import { NotificationController } from '../../../src/controllers/notification.controller';
import { INotificationService } from '../../../src/services/interfaces/notification.service.interface';
import { Notification } from '../../../src/models/entities/notification.entity';
import { NotFoundError } from '../../../src/utils/errors/not-found.error';
import { PaginatedResult } from '../../../src/utils/pagination/pagination.types';
import { EventType } from '../../../src/events/types/domain-events';

describe('NotificationController', () => {
  let controller: NotificationController;
  let mockService: jest.Mocked<INotificationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  const mockNotification: Notification = {
    id: 'notif-1',
    type: EventType.COMMENT_CREATED,
    title: 'Test Notification',
    message: 'Test message',
    recipientId: 'user-1',
    read: false,
    createdAt: new Date('2024-01-01'),
  };

  const mockPaginatedResult: PaginatedResult<Notification> = {
    data: [mockNotification],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  beforeEach(() => {
    mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      getUnreadCount: jest.fn(),
      create: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
    };

    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };

    controller = new NotificationController(mockService);
  });

  describe('getAll', () => {
    it('should return paginated notifications for recipient', async () => {
      mockRequest = {
        params: { recipientId: 'user-1' },
        validatedQuery: { page: 1, limit: 10 },
        query: {},
      };
      mockService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockService.findAll).toHaveBeenCalledWith('user-1', expect.any(Object));
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: mockPaginatedResult.data,
        meta: mockPaginatedResult.meta,
      });
    });

    it('should use req.query when validatedQuery is not present', async () => {
      mockRequest = {
        params: { recipientId: 'user-1' },
        validatedQuery: undefined,
        query: { page: '2', limit: '5' },
      };
      mockService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockService.findAll).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return notification when found', async () => {
      mockRequest = { params: { id: 'notif-1' } };
      mockService.findById.mockResolvedValue(mockNotification);

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
      });
    });

    it('should throw NotFoundError when notification not found', async () => {
      mockRequest = { params: { id: 'non-existent' } };
      const error = new NotFoundError('Notification', 'non-existent');
      mockService.findById.mockRejectedValue(error);

      await expect(
        controller.getById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for recipient', async () => {
      mockRequest = { params: { recipientId: 'user-1' } };
      mockService.getUnreadCount.mockResolvedValue(5);

      await controller.getUnreadCount(mockRequest as Request, mockResponse as Response);

      expect(mockService.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { unreadCount: 5 },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read and return it', async () => {
      const readNotification = { ...mockNotification, read: true, readAt: new Date() };
      mockRequest = { params: { id: 'notif-1' } };
      mockService.markAsRead.mockResolvedValue(readNotification);

      await controller.markAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockService.markAsRead).toHaveBeenCalledWith('notif-1');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: readNotification,
      });
    });

    it('should throw NotFoundError when notification not found', async () => {
      mockRequest = { params: { id: 'non-existent' } };
      const error = new NotFoundError('Notification', 'non-existent');
      mockService.markAsRead.mockRejectedValue(error);

      await expect(
        controller.markAsRead(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read and return count', async () => {
      mockRequest = { params: { recipientId: 'user-1' } };
      mockService.markAllAsRead.mockResolvedValue(3);

      await controller.markAllAsRead(mockRequest as Request, mockResponse as Response);

      expect(mockService.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { markedCount: 3 },
      });
    });
  });

  describe('delete', () => {
    it('should delete notification and return success', async () => {
      mockRequest = { params: { id: 'notif-1' } };
      mockService.delete.mockResolvedValue();

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(mockService.delete).toHaveBeenCalledWith('notif-1');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Notification deleted successfully',
      });
    });

    it('should throw NotFoundError when notification not found', async () => {
      mockRequest = { params: { id: 'non-existent' } };
      const error = new NotFoundError('Notification', 'non-existent');
      mockService.delete.mockRejectedValue(error);

      await expect(
        controller.delete(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
