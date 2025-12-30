import { Router } from 'express';
import { Container } from 'inversify';
import { TYPES } from '../config/types.js';
import { CommentController } from '../controllers/comment.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createCommentSchema,
  updateCommentSchema,
  idParamSchema,
} from '../validators/comment.validator.js';
import { paginationQuerySchema } from '../validators/pagination.validator.js';

export function createCommentRoutes(container: Container): Router {
  const router = Router();
  const controller = container.get<CommentController>(TYPES.CommentController);

  /**
   * @swagger
   * /api/v1/comments:
   *   get:
   *     summary: Obtener todos los comentarios (paginado)
   *     tags: [Comments]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Items por página
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, updatedAt]
   *           default: createdAt
   *         description: Campo para ordenar
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Dirección del ordenamiento
   *     responses:
   *       200:
   *         description: Lista paginada de comentarios
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedCommentResponse'
   */
  router.get(
    '/',
    validate(paginationQuerySchema, 'query'),
    asyncHandler((req, res) => controller.getAll(req, res))
  );

  /**
   * @swagger
   * /api/v1/comments/{id}:
   *   get:
   *     summary: Obtener un comentario por ID
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del comentario
   *     responses:
   *       200:
   *         description: Comentario encontrado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Comment'
   *       404:
   *         description: Comentario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/:id',
    validate(idParamSchema, 'params'),
    asyncHandler((req, res) => controller.getById(req, res))
  );

  /**
   * @swagger
   * /api/v1/comments/{id}/replies:
   *   get:
   *     summary: Obtener respuestas de un comentario
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del comentario padre
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Items por página
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, updatedAt]
   *           default: createdAt
   *         description: Campo para ordenar
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Dirección del ordenamiento
   *     responses:
   *       200:
   *         description: Lista paginada de respuestas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedCommentResponse'
   *       404:
   *         description: Comentario padre no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/:id/replies',
    validate(idParamSchema, 'params'),
    validate(paginationQuerySchema, 'query'),
    asyncHandler((req, res) => controller.getReplies(req, res))
  );

  /**
   * @swagger
   * /api/v1/comments/{id}/replies:
   *   post:
   *     summary: Crear una respuesta a un comentario
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del comentario padre
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateReplyDto'
   *     responses:
   *       201:
   *         description: Respuesta creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Comment'
   *       400:
   *         description: Error de validación
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Comentario padre no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/:id/replies',
    validate(idParamSchema, 'params'),
    validate(createCommentSchema, 'body'),
    asyncHandler((req, res) => controller.createReply(req, res))
  );

  /**
   * @swagger
   * /api/v1/comments:
   *   post:
   *     summary: Crear un nuevo comentario
   *     tags: [Comments]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCommentDto'
   *     responses:
   *       201:
   *         description: Comentario creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Comment'
   *       400:
   *         description: Error de validación
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/',
    validate(createCommentSchema, 'body'),
    asyncHandler((req, res) => controller.create(req, res))
  );

  /**
   * @swagger
   * /api/v1/comments/{id}:
   *   put:
   *     summary: Actualizar un comentario
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del comentario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateCommentDto'
   *     responses:
   *       200:
   *         description: Comentario actualizado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Comment'
   *       404:
   *         description: Comentario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/:id',
    validate(idParamSchema, 'params'),
    validate(updateCommentSchema, 'body'),
    asyncHandler((req, res) => controller.update(req, res))
  );

  /**
   * @swagger
   * /api/v1/comments/{id}:
   *   delete:
   *     summary: Eliminar un comentario
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del comentario
   *     responses:
   *       200:
   *         description: Comentario eliminado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Comment deleted successfully
   *       404:
   *         description: Comentario no encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete(
    '/:id',
    validate(idParamSchema, 'params'),
    asyncHandler((req, res) => controller.delete(req, res))
  );

  return router;
}
