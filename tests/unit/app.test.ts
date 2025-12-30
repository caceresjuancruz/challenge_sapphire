import request from 'supertest';
import { createApp } from '../../src/app';

describe('App', () => {
  describe('createApp', () => {
    it('should create an express application and container', () => {
      const { app, container } = createApp();
      expect(app).toBeDefined();
      expect(container).toBeDefined();
    });

    it('should have health endpoint', async () => {
      const { app } = createApp();
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });

    it('should have swagger docs endpoint', async () => {
      const { app } = createApp();
      const response = await request(app).get('/api-docs.json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('openapi');
    });

    it('should have cors enabled', async () => {
      const { app } = createApp();
      const response = await request(app)
        .options('/api/v1/comments')
        .set('Origin', 'http://example.com');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
