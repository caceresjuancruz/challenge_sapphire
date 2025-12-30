import { Notification } from '../../models/entities/notification.entity.js';
import { CreateNotificationDto } from '../../models/dto/create-notification.dto.js';
import { PaginationOptions, PaginatedResult } from '../../utils/pagination/pagination.types.js';

export interface INotificationRepository {
  findAll(recipientId: string, options: PaginationOptions): Promise<PaginatedResult<Notification>>;
  findById(id: string): Promise<Notification | null>;
  findUnreadCount(recipientId: string): Promise<number>;
  create(data: CreateNotificationDto): Promise<Notification>;
  markAsRead(id: string): Promise<Notification | null>;
  markAllAsRead(recipientId: string): Promise<number>;
  delete(id: string): Promise<boolean>;
}
