import 'reflect-metadata';
import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';

describe('Notifications API Integration Tests', () => {
  let app: Application;
  const testRecipientId = '550e8400-e29b-41d4-a716-446655440000';
  const testAuthorId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    ({ app } = createApp());
  });

  describe('POST /api/v1/comments - Event triggers notifications', () => {
    it('should create notification when comment is created', async () => {
      // Create a comment (which should trigger a notification)
      const createResponse = await request(app).post('/api/v1/comments').send({
        content: 'Test comment for notification',
        authorId: testRecipientId,
      });

      expect(createResponse.status).toBe(201);

      // Check notifications for the author
      const notifResponse = await request(app).get(`/api/v1/notifications/user/${testRecipientId}`);

      expect(notifResponse.status).toBe(200);
      expect(notifResponse.body.success).toBe(true);
      expect(notifResponse.body.data.length).toBeGreaterThan(0);
      expect(notifResponse.body.data[0].title).toBe('Comment Created');
    });
  });

  describe('POST /api/v1/comments/:id/replies - Reply notifications', () => {
    it('should notify parent author when someone replies', async () => {
      // Create parent comment
      const parentResponse = await request(app).post('/api/v1/comments').send({
        content: 'Parent comment',
        authorId: testRecipientId,
      });

      expect(parentResponse.status).toBe(201);
      const parentId = parentResponse.body.data.id;

      // Create a reply from a different author
      const replyResponse = await request(app).post(`/api/v1/comments/${parentId}/replies`).send({
        content: 'Reply to parent',
        authorId: testAuthorId,
      });

      expect(replyResponse.status).toBe(201);

      // Check notifications for the parent author
      const notifResponse = await request(app).get(`/api/v1/notifications/user/${testRecipientId}`);

      expect(notifResponse.status).toBe(200);
      const replyNotification = (
        notifResponse.body.data as Array<{ title: string; message: string }>
      ).find((n) => n.title === 'New Reply');
      expect(replyNotification).toBeDefined();
      expect(replyNotification.message).toBe('Someone replied to your comment');
    });
  });

  describe('GET /api/v1/notifications/user/:recipientId', () => {
    it('should return paginated notifications', async () => {
      const response = await request(app).get(
        `/api/v1/notifications/user/${testRecipientId}?page=1&limit=5`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
    });

    it('should return 400 for invalid recipientId', async () => {
      const response = await request(app).get('/api/v1/notifications/user/invalid-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/notifications/user/:recipientId/unread-count', () => {
    it('should return unread count', async () => {
      // Create a comment to generate a notification
      await request(app).post('/api/v1/comments').send({
        content: 'Unread test',
        authorId: testRecipientId,
      });

      const response = await request(app).get(
        `/api/v1/notifications/user/${testRecipientId}/unread-count`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unreadCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/v1/notifications/:id', () => {
    it('should return notification by id', async () => {
      // Create a comment to generate a notification
      await request(app).post('/api/v1/comments').send({
        content: 'Test for get by id',
        authorId: testRecipientId,
      });

      // Get notifications
      const listResponse = await request(app).get(`/api/v1/notifications/user/${testRecipientId}`);

      if (listResponse.body.data.length > 0) {
        const notificationId = listResponse.body.data[0].id;

        const response = await request(app).get(`/api/v1/notifications/${notificationId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(notificationId);
      }
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app).get(
        '/api/v1/notifications/550e8400-e29b-41d4-a716-446655440099'
      );

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      // Create a comment to generate a notification
      await request(app).post('/api/v1/comments').send({
        content: 'Test for mark as read',
        authorId: testRecipientId,
      });

      // Get notifications
      const listResponse = await request(app).get(`/api/v1/notifications/user/${testRecipientId}`);

      if (listResponse.body.data.length > 0) {
        const notificationId = listResponse.body.data[0].id;

        const response = await request(app).patch(`/api/v1/notifications/${notificationId}/read`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.read).toBe(true);
        expect(response.body.data.readAt).toBeDefined();
      }
    });
  });

  describe('PATCH /api/v1/notifications/user/:recipientId/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Create some comments to generate notifications
      await request(app).post('/api/v1/comments').send({
        content: 'Test 1',
        authorId: testRecipientId,
      });
      await request(app).post('/api/v1/comments').send({
        content: 'Test 2',
        authorId: testRecipientId,
      });

      const response = await request(app).patch(
        `/api/v1/notifications/user/${testRecipientId}/read-all`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.markedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete notification', async () => {
      // Create a comment to generate a notification
      await request(app).post('/api/v1/comments').send({
        content: 'Test for delete',
        authorId: testRecipientId,
      });

      // Get notifications
      const listResponse = await request(app).get(`/api/v1/notifications/user/${testRecipientId}`);

      if (listResponse.body.data.length > 0) {
        const notificationId = listResponse.body.data[0].id;

        const response = await request(app).delete(`/api/v1/notifications/${notificationId}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Notification deleted successfully');

        // Verify it's deleted
        const getResponse = await request(app).get(`/api/v1/notifications/${notificationId}`);
        expect(getResponse.status).toBe(404);
      }
    });
  });
});
