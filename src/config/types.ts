export const TYPES = {
  // Comment domain
  CommentRepository: Symbol.for('CommentRepository'),
  CommentService: Symbol.for('CommentService'),
  CommentController: Symbol.for('CommentController'),

  // Notification domain
  NotificationRepository: Symbol.for('NotificationRepository'),
  NotificationService: Symbol.for('NotificationService'),
  NotificationController: Symbol.for('NotificationController'),

  // Events
  EventBus: Symbol.for('EventBus'),

  // Logger
  LogRepository: Symbol.for('LogRepository'),
  LoggerService: Symbol.for('LoggerService'),

  // Middleware
  ErrorHandler: Symbol.for('ErrorHandler'),
};
