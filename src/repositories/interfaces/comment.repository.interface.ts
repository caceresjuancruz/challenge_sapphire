import { Comment } from '../../models/entities/comment.entity.js';
import { CreateCommentDto } from '../../models/dto/create-comment.dto.js';
import { UpdateCommentDto } from '../../models/dto/update-comment.dto.js';
import { PaginationOptions, PaginatedResult } from '../../utils/pagination/pagination.types.js';

export interface ICommentRepository {
  findAll(options: PaginationOptions): Promise<PaginatedResult<Comment>>;
  findById(id: string): Promise<Comment | null>;
  findReplies(parentId: string, options: PaginationOptions): Promise<PaginatedResult<Comment>>;
  create(data: CreateCommentDto): Promise<Comment>;
  update(id: string, data: UpdateCommentDto): Promise<Comment | null>;
  delete(id: string): Promise<boolean>;
  deleteReplies(parentId: string): Promise<number>;
}
