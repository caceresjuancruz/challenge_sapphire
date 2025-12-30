import 'reflect-metadata';
import { NotificationRepository } from '../../../src/repositories/notification.repository';
import { EventType } from '../../../src/events/types/domain-events';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;

  beforeEach(() => {
    repository = new NotificationRepository();
  });

  describe('create', () => {
    it('should create notification with UUID and timestamps', async () => {
      const result = await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test Title',
        message: 'Test message',
        recipientId: 'recipient-1',
      });

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(result.type).toBe(EventType.COMMENT_CREATED);
      expect(result.title).toBe('Test Title');
      expect(result.message).toBe('Test message');
      expect(result.recipientId).toBe('recipient-1');
      expect(result.read).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.readAt).toBeUndefined();
    });

    it('should store metadata if provided', async () => {
      const result = await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test',
        message: 'Test',
        recipientId: 'recipient-1',
        metadata: { commentId: 'comment-1' },
      });

      expect(result.metadata).toEqual({ commentId: 'comment-1' });
    });
  });

  describe('findById', () => {
    it('should return null for non-existent notification', async () => {
      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });

    it('should return notification when found', async () => {
      const created = await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test',
        message: 'Test',
        recipientId: 'recipient-1',
      });

      const result = await repository.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });
  });

  describe('findAll', () => {
    it('should return empty result for user with no notifications', async () => {
      const result = await repository.findAll('no-notifications', { page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should return only notifications for specific recipient', async () => {
      await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'For User 1',
        message: 'Test',
        recipientId: 'user-1',
      });
      await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'For User 2',
        message: 'Test',
        recipientId: 'user-2',
      });

      const result = await repository.findAll('user-1', { page: 1, limit: 10 });

      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toBe('For User 1');
    });

    it('should paginate results', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create({
          type: EventType.COMMENT_CREATED,
          title: `Notification ${i}`,
          message: 'Test',
          recipientId: 'user-1',
        });
      }

      const result = await repository.findAll('user-1', { page: 1, limit: 2 });

      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(5);
      expect(result.meta.hasNextPage).toBe(true);
    });
  });

  describe('findUnreadCount', () => {
    it('should return 0 when no notifications', async () => {
      const count = await repository.findUnreadCount('user-1');
      expect(count).toBe(0);
    });

    it('should count only unread notifications', async () => {
      const notif1 = await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test 1',
        message: 'Test',
        recipientId: 'user-1',
      });
      await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test 2',
        message: 'Test',
        recipientId: 'user-1',
      });
      await repository.markAsRead(notif1.id);

      const count = await repository.findUnreadCount('user-1');

      expect(count).toBe(1);
    });

    it('should only count notifications for specific recipient', async () => {
      await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test',
        message: 'Test',
        recipientId: 'user-1',
      });
      await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test',
        message: 'Test',
        recipientId: 'user-2',
      });

      const count = await repository.findUnreadCount('user-1');

      expect(count).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should return null for non-existent notification', async () => {
      const result = await repository.markAsRead('non-existent');
      expect(result).toBeNull();
    });

    it('should mark notification as read and set readAt', async () => {
      const created = await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test',
        message: 'Test',
        recipientId: 'user-1',
      });

      const result = await repository.markAsRead(created.id);

      expect(result).not.toBeNull();
      expect(result?.read).toBe(true);
      expect(result?.readAt).toBeInstanceOf(Date);
    });
  });

  describe('markAllAsRead', () => {
    it('should return 0 when no unread notifications', async () => {
      const count = await repository.markAllAsRead('user-1');
      expect(count).toBe(0);
    });

    it('should mark all unread notifications as read', async () => {
      await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test 1',
        message: 'Test',
        recipientId: 'user-1',
      });
      await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test 2',
        message: 'Test',
        recipientId: 'user-1',
      });

      const count = await repository.markAllAsRead('user-1');
      const unreadCount = await repository.findUnreadCount('user-1');

      expect(count).toBe(2);
      expect(unreadCount).toBe(0);
    });

    it('should only mark notifications for specific recipient', async () => {
      await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test',
        message: 'Test',
        recipientId: 'user-1',
      });
      await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test',
        message: 'Test',
        recipientId: 'user-2',
      });

      await repository.markAllAsRead('user-1');
      const user2UnreadCount = await repository.findUnreadCount('user-2');

      expect(user2UnreadCount).toBe(1);
    });
  });

  describe('delete', () => {
    it('should return false for non-existent notification', async () => {
      const result = await repository.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should return true and remove notification', async () => {
      const created = await repository.create({
        type: EventType.COMMENT_CREATED,
        title: 'Test',
        message: 'Test',
        recipientId: 'user-1',
      });

      const result = await repository.delete(created.id);
      const found = await repository.findById(created.id);

      expect(result).toBe(true);
      expect(found).toBeNull();
    });
  });
});
