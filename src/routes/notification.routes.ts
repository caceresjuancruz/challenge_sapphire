import { Router } from 'express';
import { Container } from 'inversify';
import { TYPES } from '../config/types.js';
import { NotificationController } from '../controllers/notification.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  recipientIdParamSchema,
  notificationIdParamSchema,
} from '../validators/notification.validator.js';
import { paginationQuerySchema } from '../validators/pagination.validator.js';

export function createNotificationRoutes(container: Container): Router {
  const router = Router();
  const controller = container.get<NotificationController>(TYPES.NotificationController);

  /**
   * @swagger
   * /api/v1/notifications/user/{recipientId}:
   *   get:
   *     summary: Obtener notificaciones de un usuario
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: recipientId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del usuario
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *     responses:
   *       200:
   *         description: Lista paginada de notificaciones
   */
  router.get(
    '/user/:recipientId',
    validate(recipientIdParamSchema, 'params'),
    validate(paginationQuerySchema, 'query'),
    asyncHandler((req, res) => controller.getAll(req, res))
  );

  /**
   * @swagger
   * /api/v1/notifications/user/{recipientId}/unread-count:
   *   get:
   *     summary: Obtener cantidad de notificaciones no leídas
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: recipientId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Cantidad de notificaciones no leídas
   */
  router.get(
    '/user/:recipientId/unread-count',
    validate(recipientIdParamSchema, 'params'),
    asyncHandler((req, res) => controller.getUnreadCount(req, res))
  );

  /**
   * @swagger
   * /api/v1/notifications/user/{recipientId}/read-all:
   *   patch:
   *     summary: Marcar todas las notificaciones como leídas
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: recipientId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Cantidad de notificaciones marcadas como leídas
   */
  router.patch(
    '/user/:recipientId/read-all',
    validate(recipientIdParamSchema, 'params'),
    asyncHandler((req, res) => controller.markAllAsRead(req, res))
  );

  /**
   * @swagger
   * /api/v1/notifications/{id}:
   *   get:
   *     summary: Obtener una notificación por ID
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Notificación encontrada
   *       404:
   *         description: Notificación no encontrada
   */
  router.get(
    '/:id',
    validate(notificationIdParamSchema, 'params'),
    asyncHandler((req, res) => controller.getById(req, res))
  );

  /**
   * @swagger
   * /api/v1/notifications/{id}/read:
   *   patch:
   *     summary: Marcar una notificación como leída
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Notificación marcada como leída
   *       404:
   *         description: Notificación no encontrada
   */
  router.patch(
    '/:id/read',
    validate(notificationIdParamSchema, 'params'),
    asyncHandler((req, res) => controller.markAsRead(req, res))
  );

  /**
   * @swagger
   * /api/v1/notifications/{id}:
   *   delete:
   *     summary: Eliminar una notificación
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Notificación eliminada
   *       404:
   *         description: Notificación no encontrada
   */
  router.delete(
    '/:id',
    validate(notificationIdParamSchema, 'params'),
    asyncHandler((req, res) => controller.delete(req, res))
  );

  return router;
}
