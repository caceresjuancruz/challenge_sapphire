import { inject, injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { TYPES } from '../config/types.js';
import { Comment } from '../models/entities/comment.entity.js';
import { CreateCommentDto } from '../models/dto/create-comment.dto.js';
import { UpdateCommentDto } from '../models/dto/update-comment.dto.js';
import { ICommentRepository } from '../repositories/interfaces/comment.repository.interface.js';
import { ICommentService } from './interfaces/comment.service.interface.js';
import { IEventBus } from '../events/interfaces/event-bus.interface.js';
import {
  EventType,
  CommentCreatedPayload,
  CommentUpdatedPayload,
  CommentDeletedPayload,
  CommentRepliedPayload,
} from '../events/types/domain-events.js';
import { NotFoundError } from '../utils/errors/not-found.error.js';
import { PaginationOptions, PaginatedResult } from '../utils/pagination/pagination.types.js';

@injectable()
export class CommentService implements ICommentService {
  constructor(
    @inject(TYPES.CommentRepository)
    private readonly commentRepository: ICommentRepository,
    @inject(TYPES.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  async findAll(options: PaginationOptions): Promise<PaginatedResult<Comment>> {
    return this.commentRepository.findAll(options);
  }

  async findById(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment', id);
    }
    return comment;
  }

  async findReplies(
    parentId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Comment>> {
    // Verify parent comment exists
    const parent = await this.commentRepository.findById(parentId);
    if (!parent) {
      throw new NotFoundError('Comment', parentId);
    }
    return this.commentRepository.findReplies(parentId, options);
  }

  async create(data: CreateCommentDto): Promise<Comment> {
    // If parentId is provided, verify it exists
    if (data.parentId) {
      const parent = await this.commentRepository.findById(data.parentId);
      if (!parent) {
        throw new NotFoundError('Comment', data.parentId);
      }
    }

    const comment = await this.commentRepository.create(data);

    // Emit event
    this.eventBus.emit<CommentCreatedPayload>({
      id: uuidv4(),
      type: EventType.COMMENT_CREATED,
      timestamp: new Date(),
      payload: {
        commentId: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        parentId: comment.parentId,
      },
    });

    return comment;
  }

  async createReply(parentId: string, data: CreateCommentDto): Promise<Comment> {
    // Verify parent comment exists
    const parent = await this.commentRepository.findById(parentId);
    if (!parent) {
      throw new NotFoundError('Comment', parentId);
    }

    const comment = await this.commentRepository.create({ ...data, parentId });

    // Emit reply event to notify parent author
    this.eventBus.emit<CommentRepliedPayload>({
      id: uuidv4(),
      type: EventType.COMMENT_REPLIED,
      timestamp: new Date(),
      payload: {
        commentId: comment.id,
        parentId: parentId,
        parentAuthorId: parent.authorId,
        replyAuthorId: comment.authorId,
        content: comment.content,
      },
    });

    return comment;
  }

  async update(id: string, data: UpdateCommentDto): Promise<Comment> {
    const existing = await this.commentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Comment', id);
    }

    const comment = await this.commentRepository.update(id, data);
    if (!comment) {
      throw new NotFoundError('Comment', id);
    }

    // Emit event
    this.eventBus.emit<CommentUpdatedPayload>({
      id: uuidv4(),
      type: EventType.COMMENT_UPDATED,
      timestamp: new Date(),
      payload: {
        commentId: comment.id,
        oldContent: existing.content,
        newContent: comment.content,
        authorId: comment.authorId,
      },
    });

    return comment;
  }

  async delete(id: string): Promise<void> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment', id);
    }

    // Cascade delete: remove all replies first
    await this.commentRepository.deleteReplies(id);

    // Then delete the comment itself
    await this.commentRepository.delete(id);

    // Emit event
    this.eventBus.emit<CommentDeletedPayload>({
      id: uuidv4(),
      type: EventType.COMMENT_DELETED,
      timestamp: new Date(),
      payload: {
        commentId: id,
        authorId: comment.authorId,
      },
    });
  }
}
