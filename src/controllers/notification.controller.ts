import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types.js';
import { INotificationService } from '../services/interfaces/notification.service.interface.js';
import { PaginationOptions } from '../utils/pagination/pagination.types.js';

@injectable()
export class NotificationController {
  constructor(
    @inject(TYPES.NotificationService)
    private readonly notificationService: INotificationService
  ) {}

  async getAll(req: Request, res: Response): Promise<void> {
    const { recipientId } = req.params;
    const query = req.validatedQuery ?? req.query;
    const options: PaginationOptions = {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      sortBy: (query.sortBy as string) || 'createdAt',
      sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await this.notificationService.findAll(recipientId, options);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const notification = await this.notificationService.findById(id);
    res.status(200).json({
      success: true,
      data: notification,
    });
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    const { recipientId } = req.params;
    const count = await this.notificationService.getUnreadCount(recipientId);
    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const notification = await this.notificationService.markAsRead(id);
    res.status(200).json({
      success: true,
      data: notification,
    });
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    const { recipientId } = req.params;
    const count = await this.notificationService.markAllAsRead(recipientId);
    res.status(200).json({
      success: true,
      data: { markedCount: count },
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await this.notificationService.delete(id);
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  }
}
