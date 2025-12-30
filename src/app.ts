import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { Container } from 'inversify';
import { createContainer } from './config/container.js';
import { TYPES } from './config/types.js';
import { createCommentRoutes } from './routes/comment.routes.js';
import { createNotificationRoutes } from './routes/notification.routes.js';
import { ErrorHandlerMiddleware } from './middleware/error-handler.middleware.js';
import { swaggerSpec } from './config/swagger.js';
import { NotFoundError } from './utils/errors/index.js';

export interface AppContext {
  app: Application;
  container: Container;
}

export function createApp(): AppContext {
  const app = express();
  const container = createContainer();

  // Get error handler from container
  const errorHandler = container.get<ErrorHandlerMiddleware>(TYPES.ErrorHandler);

  app.use(cors());
  app.use(express.json());

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api/v1/comments', createCommentRoutes(container));
  app.use('/api/v1/notifications', createNotificationRoutes(container));

  // 404 handler - throw NotFoundError for unknown routes
  app.use((req, _res, next) => {
    next(new NotFoundError('Route', req.path));
  });

  // Centralized error handler (must be last)
  app.use(errorHandler.handle());

  return { app, container };
}
