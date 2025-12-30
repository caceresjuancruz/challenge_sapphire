import { injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { Comment } from '../models/entities/comment.entity.js';
import { CreateCommentDto } from '../models/dto/create-comment.dto.js';
import { UpdateCommentDto } from '../models/dto/update-comment.dto.js';
import { ICommentRepository } from './interfaces/comment.repository.interface.js';
import { PaginationOptions, PaginatedResult } from '../utils/pagination/pagination.types.js';
import { paginate } from '../utils/pagination/pagination.helper.js';

@injectable()
export class CommentRepository implements ICommentRepository {
  private comments: Map<string, Comment> = new Map();

  async findAll(options: PaginationOptions): Promise<PaginatedResult<Comment>> {
    // Only return root comments (no parentId)
    const rootComments = Array.from(this.comments.values()).filter(
      (comment) => comment.parentId === null
    );

    const sortKeyExtractor = (comment: Comment): Date => {
      if (options.sortBy === 'updatedAt') {
        return comment.updatedAt;
      }
      return comment.createdAt;
    };

    return paginate(rootComments, options, sortKeyExtractor);
  }

  async findById(id: string): Promise<Comment | null> {
    return this.comments.get(id) ?? null;
  }

  async findReplies(
    parentId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Comment>> {
    const replies = Array.from(this.comments.values()).filter(
      (comment) => comment.parentId === parentId
    );

    const sortKeyExtractor = (comment: Comment): Date => {
      if (options.sortBy === 'updatedAt') {
        return comment.updatedAt;
      }
      return comment.createdAt;
    };

    return paginate(replies, options, sortKeyExtractor);
  }

  async create(data: CreateCommentDto): Promise<Comment> {
    const now = new Date();
    const comment: Comment = {
      id: uuidv4(),
      content: data.content,
      authorId: data.authorId,
      parentId: data.parentId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.comments.set(comment.id, comment);
    return comment;
  }

  async update(id: string, data: UpdateCommentDto): Promise<Comment | null> {
    const existing = this.comments.get(id);
    if (!existing) {
      return null;
    }

    const updated: Comment = {
      ...existing,
      content: data.content,
      updatedAt: new Date(),
    };

    this.comments.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  async deleteReplies(parentId: string): Promise<number> {
    let count = 0;
    for (const [id, comment] of this.comments) {
      if (comment.parentId === parentId) {
        this.comments.delete(id);
        count++;
      }
    }
    return count;
  }
}
