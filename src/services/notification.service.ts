import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types.js';
import { Notification } from '../models/entities/notification.entity.js';
import { CreateNotificationDto } from '../models/dto/create-notification.dto.js';
import { INotificationRepository } from '../repositories/interfaces/notification.repository.interface.js';
import { INotificationService } from './interfaces/notification.service.interface.js';
import { IEventBus } from '../events/interfaces/event-bus.interface.js';
import { ILoggerService } from './logger/logger.service.interface.js';
import {
  DomainEvent,
  EventType,
  CommentCreatedPayload,
  CommentUpdatedPayload,
  CommentDeletedPayload,
  CommentRepliedPayload,
} from '../events/types/domain-events.js';
import { NotFoundError } from '../utils/errors/not-found.error.js';
import { PaginationOptions, PaginatedResult } from '../utils/pagination/pagination.types.js';

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject(TYPES.NotificationRepository)
    private readonly notificationRepository: INotificationRepository,
    @inject(TYPES.EventBus)
    private readonly eventBus: IEventBus,
    @inject(TYPES.LoggerService)
    private readonly logger: ILoggerService
  ) {
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    this.eventBus.on<CommentCreatedPayload>(
      EventType.COMMENT_CREATED,
      this.handleCommentCreated.bind(this)
    );
    this.eventBus.on<CommentUpdatedPayload>(
      EventType.COMMENT_UPDATED,
      this.handleCommentUpdated.bind(this)
    );
    this.eventBus.on<CommentDeletedPayload>(
      EventType.COMMENT_DELETED,
      this.handleCommentDeleted.bind(this)
    );
    this.eventBus.on<CommentRepliedPayload>(
      EventType.COMMENT_REPLIED,
      this.handleCommentReplied.bind(this)
    );

    this.logger.info('NotificationService subscribed to domain events');
  }

  private async handleCommentCreated(event: DomainEvent<CommentCreatedPayload>): Promise<void> {
    this.logger.debug('Handling COMMENT_CREATED event', { eventId: event.id });

    await this.create({
      type: event.type,
      title: 'Comment Created',
      message: 'Your comment was created successfully',
      recipientId: event.payload.authorId,
      metadata: { commentId: event.payload.commentId },
    });
  }

  private async handleCommentUpdated(event: DomainEvent<CommentUpdatedPayload>): Promise<void> {
    this.logger.debug('Handling COMMENT_UPDATED event', { eventId: event.id });

    await this.create({
      type: event.type,
      title: 'Comment Updated',
      message: 'Your comment was updated successfully',
      recipientId: event.payload.authorId,
      metadata: { commentId: event.payload.commentId },
    });
  }

  private async handleCommentDeleted(event: DomainEvent<CommentDeletedPayload>): Promise<void> {
    this.logger.debug('Handling COMMENT_DELETED event', { eventId: event.id });

    await this.create({
      type: event.type,
      title: 'Comment Deleted',
      message: 'Your comment was deleted',
      recipientId: event.payload.authorId,
      metadata: { commentId: event.payload.commentId },
    });
  }

  private async handleCommentReplied(event: DomainEvent<CommentRepliedPayload>): Promise<void> {
    this.logger.debug('Handling COMMENT_REPLIED event', { eventId: event.id });

    // Notify the parent comment author about the reply
    await this.create({
      type: event.type,
      title: 'New Reply',
      message: 'Someone replied to your comment',
      recipientId: event.payload.parentAuthorId,
      metadata: {
        commentId: event.payload.commentId,
        parentId: event.payload.parentId,
        replyAuthorId: event.payload.replyAuthorId,
      },
    });
  }

  async findAll(
    recipientId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    return this.notificationRepository.findAll(recipientId, options);
  }

  async findById(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }
    return notification;
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return this.notificationRepository.findUnreadCount(recipientId);
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    return this.notificationRepository.create(data);
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.markAsRead(id);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }
    return notification;
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    return this.notificationRepository.markAllAsRead(recipientId);
  }

  async delete(id: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification', id);
    }
    await this.notificationRepository.delete(id);
  }
}
