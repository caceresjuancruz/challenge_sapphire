import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types.js';
import { ICommentService } from '../services/interfaces/comment.service.interface.js';
import { CreateCommentDto } from '../models/dto/create-comment.dto.js';
import { UpdateCommentDto } from '../models/dto/update-comment.dto.js';
import { PaginationOptions } from '../utils/pagination/pagination.types.js';

/**
 * Controller for handling comment-related HTTP requests.
 * Errors are automatically caught by asyncHandler wrapper in routes.
 */
@injectable()
export class CommentController {
  constructor(
    @inject(TYPES.CommentService)
    private readonly commentService: ICommentService
  ) {}

  async getAll(req: Request, res: Response): Promise<void> {
    const query = req.validatedQuery ?? req.query;
    const options: PaginationOptions = {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      sortBy: (query.sortBy as string) || 'createdAt',
      sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await this.commentService.findAll(options);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const comment = await this.commentService.findById(id);
    res.status(200).json({
      success: true,
      data: comment,
    });
  }

  async getReplies(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const query = req.validatedQuery ?? req.query;
    const options: PaginationOptions = {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      sortBy: (query.sortBy as string) || 'createdAt',
      sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await this.commentService.findReplies(id, options);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  async createReply(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const dto = req.body as CreateCommentDto;
    const comment = await this.commentService.createReply(id, dto);
    res.status(201).json({
      success: true,
      data: comment,
    });
  }

  async create(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateCommentDto;
    const comment = await this.commentService.create(dto);
    res.status(201).json({
      success: true,
      data: comment,
    });
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const dto = req.body as UpdateCommentDto;
    const comment = await this.commentService.update(id, dto);
    res.status(200).json({
      success: true,
      data: comment,
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await this.commentService.delete(id);
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  }
}
