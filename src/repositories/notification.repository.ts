import { injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { Notification } from '../models/entities/notification.entity.js';
import { CreateNotificationDto } from '../models/dto/create-notification.dto.js';
import { INotificationRepository } from './interfaces/notification.repository.interface.js';
import { PaginationOptions, PaginatedResult } from '../utils/pagination/pagination.types.js';
import { paginate } from '../utils/pagination/pagination.helper.js';

@injectable()
export class NotificationRepository implements INotificationRepository {
  private notifications: Map<string, Notification> = new Map();

  async findAll(
    recipientId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Notification>> {
    const userNotifications = Array.from(this.notifications.values()).filter(
      (notification) => notification.recipientId === recipientId
    );

    const sortKeyExtractor = (notification: Notification): Date => {
      return notification.createdAt;
    };

    return paginate(userNotifications, options, sortKeyExtractor);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notifications.get(id) ?? null;
  }

  async findUnreadCount(recipientId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.recipientId === recipientId && !notification.read
    ).length;
  }

  async create(data: CreateNotificationDto): Promise<Notification> {
    const now = new Date();
    const notification: Notification = {
      id: uuidv4(),
      type: data.type,
      title: data.title,
      message: data.message,
      recipientId: data.recipientId,
      read: false,
      metadata: data.metadata,
      createdAt: now,
    };

    this.notifications.set(notification.id, notification);
    return notification;
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const existing = this.notifications.get(id);
    if (!existing) {
      return null;
    }

    const updated: Notification = {
      ...existing,
      read: true,
      readAt: new Date(),
    };

    this.notifications.set(id, updated);
    return updated;
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    let count = 0;
    const now = new Date();

    for (const [id, notification] of this.notifications) {
      if (notification.recipientId === recipientId && !notification.read) {
        this.notifications.set(id, {
          ...notification,
          read: true,
          readAt: now,
        });
        count++;
      }
    }

    return count;
  }

  async delete(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }
}
