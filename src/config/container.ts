import { Container } from 'inversify';
import { TYPES } from './types.js';

// Comment domain
import { ICommentRepository } from '../repositories/interfaces/comment.repository.interface.js';
import { ICommentService } from '../services/interfaces/comment.service.interface.js';
import { CommentRepository } from '../repositories/comment.repository.js';
import { CommentService } from '../services/comment.service.js';
import { CommentController } from '../controllers/comment.controller.js';

// Notification domain
import { INotificationRepository } from '../repositories/interfaces/notification.repository.interface.js';
import { INotificationService } from '../services/interfaces/notification.service.interface.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { NotificationService } from '../services/notification.service.js';
import { NotificationController } from '../controllers/notification.controller.js';

// Events
import { IEventBus } from '../events/interfaces/event-bus.interface.js';
import { InMemoryEventBus } from '../events/in-memory-event-bus.js';

// Logger
import { ILogRepository } from '../repositories/interfaces/log.repository.interface.js';
import { ILoggerService } from '../services/logger/logger.service.interface.js';
import { LogRepository } from '../repositories/log.repository.js';
import { LoggerService } from '../services/logger/logger.service.js';

// Middleware
import { ErrorHandlerMiddleware } from '../middleware/error-handler.middleware.js';

export function createContainer(): Container {
  const container = new Container();

  // Logger bindings (register first as other services may depend on it)
  container.bind<ILogRepository>(TYPES.LogRepository).to(LogRepository).inSingletonScope();

  container.bind<ILoggerService>(TYPES.LoggerService).to(LoggerService).inSingletonScope();

  // Event bus (singleton - must be registered before services that depend on it)
  container.bind<IEventBus>(TYPES.EventBus).to(InMemoryEventBus).inSingletonScope();

  // Comment domain bindings
  container
    .bind<ICommentRepository>(TYPES.CommentRepository)
    .to(CommentRepository)
    .inSingletonScope();

  container.bind<ICommentService>(TYPES.CommentService).to(CommentService).inSingletonScope();

  container
    .bind<CommentController>(TYPES.CommentController)
    .to(CommentController)
    .inSingletonScope();

  // Notification domain bindings
  container
    .bind<INotificationRepository>(TYPES.NotificationRepository)
    .to(NotificationRepository)
    .inSingletonScope();

  container
    .bind<INotificationService>(TYPES.NotificationService)
    .to(NotificationService)
    .inSingletonScope();

  container
    .bind<NotificationController>(TYPES.NotificationController)
    .to(NotificationController)
    .inSingletonScope();

  // Middleware bindings
  container.bind<ErrorHandlerMiddleware>(TYPES.ErrorHandler).to(ErrorHandlerMiddleware);

  return container;
}
