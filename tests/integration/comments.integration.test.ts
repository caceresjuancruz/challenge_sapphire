import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';

describe('Comments API Integration Tests', () => {
  let app: Application;

  beforeEach(() => {
    ({ app } = createApp());
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/comments', () => {
    it('should return empty list initially', async () => {
      const response = await request(app).get('/api/v1/comments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta).toHaveProperty('total', 0);
    });

    it('should return paginated results', async () => {
      // Create some comments first
      await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Comment 1', authorId: '123e4567-e89b-12d3-a456-426614174000' });
      await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Comment 2', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await request(app).get('/api/v1/comments?page=1&limit=1');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.meta.total).toBe(2);
      expect(response.body.meta.totalPages).toBe(2);
    });

    it('should support sorting', async () => {
      await request(app)
        .post('/api/v1/comments')
        .send({ content: 'First', authorId: '123e4567-e89b-12d3-a456-426614174000' });
      await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Second', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const descResponse = await request(app).get('/api/v1/comments?sortOrder=desc');
      const ascResponse = await request(app).get('/api/v1/comments?sortOrder=asc');

      expect(descResponse.body.data[0].content).toBe('Second');
      expect(ascResponse.body.data[0].content).toBe('First');
    });
  });

  describe('POST /api/v1/comments', () => {
    it('should create a new comment', async () => {
      const newComment = {
        content: 'Test comment content',
        authorId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const response = await request(app).post('/api/v1/comments').send(newComment);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe(newComment.content);
      expect(response.body.data.authorId).toBe(newComment.authorId);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should return 400 for missing content', async () => {
      const response = await request(app)
        .post('/api/v1/comments')
        .send({ authorId: '123e4567-e89b-12d3-a456-426614174000' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid authorId', async () => {
      const response = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Test', authorId: 'invalid-uuid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty content', async () => {
      const response = await request(app)
        .post('/api/v1/comments')
        .send({ content: '', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/comments/:id', () => {
    it('should return comment by id', async () => {
      const createResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Test', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const commentId = createResponse.body.data.id;
      const response = await request(app).get(`/api/v1/comments/${commentId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(commentId);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app).get(
        '/api/v1/comments/123e4567-e89b-12d3-a456-426614174999'
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/v1/comments/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/comments/:id', () => {
    it('should update comment', async () => {
      const createResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Original', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const commentId = createResponse.body.data.id;
      const response = await request(app)
        .put(`/api/v1/comments/${commentId}`)
        .send({ content: 'Updated content' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Updated content');
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .put('/api/v1/comments/123e4567-e89b-12d3-a456-426614174999')
        .send({ content: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for empty content', async () => {
      const createResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Original', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await request(app)
        .put(`/api/v1/comments/${createResponse.body.data.id}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    it('should delete comment', async () => {
      const createResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'To delete', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const commentId = createResponse.body.data.id;
      const deleteResponse = await request(app).delete(`/api/v1/comments/${commentId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify deletion
      const getResponse = await request(app).get(`/api/v1/comments/${commentId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app).delete(
        '/api/v1/comments/123e4567-e89b-12d3-a456-426614174999'
      );

      expect(response.status).toBe(404);
    });

    it('should cascade delete replies when parent is deleted', async () => {
      // Create parent comment
      const parentResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Parent', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const parentId = parentResponse.body.data.id;

      // Create reply
      const replyResponse = await request(app)
        .post(`/api/v1/comments/${parentId}/replies`)
        .send({ content: 'Reply', authorId: '123e4567-e89b-12d3-a456-426614174001' });

      const replyId = replyResponse.body.data.id;

      // Delete parent
      await request(app).delete(`/api/v1/comments/${parentId}`);

      // Verify reply is also deleted
      const getReplyResponse = await request(app).get(`/api/v1/comments/${replyId}`);
      expect(getReplyResponse.status).toBe(404);
    });
  });

  describe('GET /api/v1/comments/:id/replies', () => {
    it('should return replies for a comment', async () => {
      // Create parent comment
      const parentResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Parent comment', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const parentId = parentResponse.body.data.id;

      // Create replies
      await request(app)
        .post(`/api/v1/comments/${parentId}/replies`)
        .send({ content: 'Reply 1', authorId: '123e4567-e89b-12d3-a456-426614174001' });
      await request(app)
        .post(`/api/v1/comments/${parentId}/replies`)
        .send({ content: 'Reply 2', authorId: '123e4567-e89b-12d3-a456-426614174002' });

      const response = await request(app).get(`/api/v1/comments/${parentId}/replies`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta.total).toBe(2);
    });

    it('should return 404 for non-existent parent', async () => {
      const response = await request(app).get(
        '/api/v1/comments/123e4567-e89b-12d3-a456-426614174999/replies'
      );

      expect(response.status).toBe(404);
    });

    it('should support pagination for replies', async () => {
      const parentResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Parent', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const parentId = parentResponse.body.data.id;

      // Create 3 replies
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/v1/comments/${parentId}/replies`)
          .send({ content: `Reply ${i}`, authorId: '123e4567-e89b-12d3-a456-426614174001' });
      }

      const response = await request(app).get(
        `/api/v1/comments/${parentId}/replies?page=1&limit=2`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta.total).toBe(3);
      expect(response.body.meta.hasNextPage).toBe(true);
    });
  });

  describe('POST /api/v1/comments/:id/replies', () => {
    it('should create a reply to a comment', async () => {
      const parentResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Parent comment', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const parentId = parentResponse.body.data.id;

      const response = await request(app)
        .post(`/api/v1/comments/${parentId}/replies`)
        .send({ content: 'This is a reply', authorId: '123e4567-e89b-12d3-a456-426614174001' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('This is a reply');
      expect(response.body.data.parentId).toBe(parentId);
    });

    it('should return 404 for non-existent parent', async () => {
      const response = await request(app)
        .post('/api/v1/comments/123e4567-e89b-12d3-a456-426614174999/replies')
        .send({ content: 'Reply', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid data', async () => {
      const parentResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Parent', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await request(app)
        .post(`/api/v1/comments/${parentResponse.body.data.id}/replies`)
        .send({ content: '', authorId: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/comments with parentId', () => {
    it('should create comment with parentId', async () => {
      const parentResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Parent', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const parentId = parentResponse.body.data.id;

      const response = await request(app).post('/api/v1/comments').send({
        content: 'Child comment',
        authorId: '123e4567-e89b-12d3-a456-426614174001',
        parentId: parentId,
      });

      expect(response.status).toBe(201);
      expect(response.body.data.parentId).toBe(parentId);
    });

    it('should return 404 for non-existent parentId', async () => {
      const response = await request(app).post('/api/v1/comments').send({
        content: 'Child',
        authorId: '123e4567-e89b-12d3-a456-426614174000',
        parentId: '123e4567-e89b-12d3-a456-426614174999',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Root comments only in findAll', () => {
    it('should only return root comments in main listing', async () => {
      // Create parent
      const parentResponse = await request(app)
        .post('/api/v1/comments')
        .send({ content: 'Parent', authorId: '123e4567-e89b-12d3-a456-426614174000' });

      const parentId = parentResponse.body.data.id;

      // Create reply
      await request(app)
        .post(`/api/v1/comments/${parentId}/replies`)
        .send({ content: 'Reply', authorId: '123e4567-e89b-12d3-a456-426614174001' });

      // Get all comments - should only include parent
      const response = await request(app).get('/api/v1/comments');

      const allHaveNoParent = (response.body.data as Array<{ parentId: string | null }>).every(
        (comment) => comment.parentId === null
      );
      expect(allHaveNoParent).toBe(true);
    });
  });

  describe('404 for unknown routes', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });
  });
});
