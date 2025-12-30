import 'reflect-metadata';
import { NotificationService } from '../../../src/services/notification.service';
import { INotificationRepository } from '../../../src/repositories/interfaces/notification.repository.interface';
import { IEventBus } from '../../../src/events/interfaces/event-bus.interface';
import { ILoggerService } from '../../../src/services/logger/logger.service.interface';
import { Notification } from '../../../src/models/entities/notification.entity';
import { NotFoundError } from '../../../src/utils/errors/not-found.error';
import {
  EventType,
  DomainEvent,
  CommentCreatedPayload,
  CommentRepliedPayload,
} from '../../../src/events/types/domain-events';
import { PaginatedResult } from '../../../src/utils/pagination/pagination.types';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRepository: jest.Mocked<INotificationRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockLogger: jest.Mocked<ILoggerService>;

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
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findUnreadCount: jest.fn(),
      create: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
    };

    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    };

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<ILoggerService>;

    service = new NotificationService(mockRepository, mockEventBus, mockLogger);
  });

  describe('constructor', () => {
    it('should subscribe to domain events', () => {
      expect(mockEventBus.on).toHaveBeenCalledWith(EventType.COMMENT_CREATED, expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith(EventType.COMMENT_UPDATED, expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith(EventType.COMMENT_DELETED, expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith(EventType.COMMENT_REPLIED, expect.any(Function));
      expect(mockLogger.info).toHaveBeenCalledWith(
        'NotificationService subscribed to domain events'
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications for recipient', async () => {
      mockRepository.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await service.findAll('user-1', { page: 1, limit: 10 });

      expect(mockRepository.findAll).toHaveBeenCalledWith('user-1', { page: 1, limit: 10 });
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findById', () => {
    it('should return notification when found', async () => {
      mockRepository.findById.mockResolvedValue(mockNotification);

      const result = await service.findById('notif-1');

      expect(mockRepository.findById).toHaveBeenCalledWith('notif-1');
      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundError when notification not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for recipient', async () => {
      mockRepository.findUnreadCount.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(mockRepository.findUnreadCount).toHaveBeenCalledWith('user-1');
      expect(result).toBe(5);
    });
  });

  describe('create', () => {
    it('should create notification', async () => {
      const createDto = {
        type: EventType.COMMENT_CREATED,
        title: 'New',
        message: 'Message',
        recipientId: 'user-1',
      };
      mockRepository.create.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read when found', async () => {
      const readNotification = { ...mockNotification, read: true, readAt: new Date() };
      mockRepository.markAsRead.mockResolvedValue(readNotification);

      const result = await service.markAsRead('notif-1');

      expect(mockRepository.markAsRead).toHaveBeenCalledWith('notif-1');
      expect(result.read).toBe(true);
    });

    it('should throw NotFoundError when notification not found', async () => {
      mockRepository.markAsRead.mockResolvedValue(null);

      await expect(service.markAsRead('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for recipient', async () => {
      mockRepository.markAllAsRead.mockResolvedValue(3);

      const result = await service.markAllAsRead('user-1');

      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(result).toBe(3);
    });
  });

  describe('delete', () => {
    it('should delete notification when found', async () => {
      mockRepository.findById.mockResolvedValue(mockNotification);
      mockRepository.delete.mockResolvedValue(true);

      await expect(service.delete('notif-1')).resolves.toBeUndefined();

      expect(mockRepository.findById).toHaveBeenCalledWith('notif-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('notif-1');
    });

    it('should throw NotFoundError when notification not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('event handlers', () => {
    it('should handle COMMENT_CREATED event', async () => {
      mockRepository.create.mockResolvedValue(mockNotification);

      // Get the handler that was registered for COMMENT_CREATED
      const onCall = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EventType.COMMENT_CREATED
      );
      const handler = onCall?.[1] as (event: DomainEvent<CommentCreatedPayload>) => Promise<void>;

      const event: DomainEvent<CommentCreatedPayload> = {
        id: 'event-1',
        type: EventType.COMMENT_CREATED,
        timestamp: new Date(),
        payload: {
          commentId: 'comment-1',
          content: 'Test',
          authorId: 'author-1',
          parentId: null,
        },
      };

      await handler(event);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.COMMENT_CREATED,
          title: 'Comment Created',
          recipientId: 'author-1',
        })
      );
    });

    it('should handle COMMENT_REPLIED event', async () => {
      mockRepository.create.mockResolvedValue(mockNotification);

      // Get the handler that was registered for COMMENT_REPLIED
      const onCall = mockEventBus.on.mock.calls.find(
        (call) => call[0] === EventType.COMMENT_REPLIED
      );
      const handler = onCall?.[1] as (event: DomainEvent<CommentRepliedPayload>) => Promise<void>;

      const event: DomainEvent<CommentRepliedPayload> = {
        id: 'event-1',
        type: EventType.COMMENT_REPLIED,
        timestamp: new Date(),
        payload: {
          commentId: 'reply-1',
          parentId: 'parent-1',
          parentAuthorId: 'parent-author',
          replyAuthorId: 'reply-author',
          content: 'Reply content',
        },
      };

      await handler(event);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.COMMENT_REPLIED,
          title: 'New Reply',
          message: 'Someone replied to your comment',
          recipientId: 'parent-author',
        })
      );
    });
  });
});
