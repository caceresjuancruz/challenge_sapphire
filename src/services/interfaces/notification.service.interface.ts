import { Notification } from '../../models/entities/notification.entity.js';
import { CreateNotificationDto } from '../../models/dto/create-notification.dto.js';
import { PaginationOptions, PaginatedResult } from '../../utils/pagination/pagination.types.js';

export interface INotificationService {
  findAll(recipientId: string, options: PaginationOptions): Promise<PaginatedResult<Notification>>;
  findById(id: string): Promise<Notification>;
  getUnreadCount(recipientId: string): Promise<number>;
  create(data: CreateNotificationDto): Promise<Notification>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(recipientId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
