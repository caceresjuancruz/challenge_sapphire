import 'reflect-metadata';
import { Request, Response } from 'express';
import { CommentController } from '../../../src/controllers/comment.controller';
import { ICommentService } from '../../../src/services/interfaces/comment.service.interface';
import { Comment } from '../../../src/models/entities/comment.entity';
import { NotFoundError } from '../../../src/utils/errors/not-found.error';
import { PaginatedResult } from '../../../src/utils/pagination/pagination.types';

describe('CommentController', () => {
  let controller: CommentController;
  let mockService: jest.Mocked<ICommentService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  const mockComment: Comment = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    content: 'Test comment',
    authorId: '123e4567-e89b-12d3-a456-426614174001',
    parentId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPaginatedResult: PaginatedResult<Comment> = {
    data: [mockComment],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  beforeEach(() => {
    mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findReplies: jest.fn(),
      create: jest.fn(),
      createReply: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };

    controller = new CommentController(mockService);
  });

  describe('getAll', () => {
    it('should return paginated comments with validatedQuery', async () => {
      mockRequest = {
        validatedQuery: { page: 1, limit: 10 },
        query: {},
      };
      mockService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: mockPaginatedResult.data,
        meta: mockPaginatedResult.meta,
      });
    });

    it('should use req.query when validatedQuery is not present', async () => {
      mockRequest = {
        validatedQuery: undefined,
        query: { page: '2', limit: '5' },
      };
      mockService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockService.findAll).toHaveBeenCalled();
    });

    it('should throw error on failure (caught by asyncHandler)', async () => {
      mockRequest = { query: {} };
      const error = new Error('Database error');
      mockService.findAll.mockRejectedValue(error);

      await expect(
        controller.getAll(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should return comment when found', async () => {
      mockRequest = { params: { id: mockComment.id } };
      mockService.findById.mockResolvedValue(mockComment);

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: mockComment,
      });
    });

    it('should throw NotFoundError when comment not found', async () => {
      mockRequest = { params: { id: 'non-existent' } };
      const error = new NotFoundError('Comment', 'non-existent');
      mockService.findById.mockRejectedValue(error);

      await expect(
        controller.getById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getReplies', () => {
    it('should return paginated replies', async () => {
      const replyComment = { ...mockComment, parentId: 'parent-id' };
      const repliesResult: PaginatedResult<Comment> = {
        data: [replyComment],
        meta: mockPaginatedResult.meta,
      };
      mockRequest = {
        params: { id: 'parent-id' },
        validatedQuery: { page: 1, limit: 10 },
        query: {},
      };
      mockService.findReplies.mockResolvedValue(repliesResult);

      await controller.getReplies(mockRequest as Request, mockResponse as Response);

      expect(mockService.findReplies).toHaveBeenCalledWith('parent-id', expect.any(Object));
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: repliesResult.data,
        meta: repliesResult.meta,
      });
    });

    it('should throw NotFoundError when parent comment not found', async () => {
      mockRequest = {
        params: { id: 'non-existent' },
        query: {},
      };
      const error = new NotFoundError('Comment', 'non-existent');
      mockService.findReplies.mockRejectedValue(error);

      await expect(
        controller.getReplies(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createReply', () => {
    it('should create reply and return 201', async () => {
      const replyComment = { ...mockComment, id: 'reply-id', parentId: 'parent-id' };
      mockRequest = {
        params: { id: 'parent-id' },
        body: { content: 'Reply content', authorId: 'author-id' },
      };
      mockService.createReply.mockResolvedValue(replyComment);

      await controller.createReply(mockRequest as Request, mockResponse as Response);

      expect(mockService.createReply).toHaveBeenCalledWith('parent-id', {
        content: 'Reply content',
        authorId: 'author-id',
      });
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: replyComment,
      });
    });

    it('should throw NotFoundError when parent comment not found', async () => {
      mockRequest = {
        params: { id: 'non-existent' },
        body: { content: 'Reply', authorId: 'author' },
      };
      const error = new NotFoundError('Comment', 'non-existent');
      mockService.createReply.mockRejectedValue(error);

      await expect(
        controller.createReply(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create and return comment', async () => {
      mockRequest = {
        body: { content: 'New comment', authorId: mockComment.authorId },
      };
      mockService.create.mockResolvedValue(mockComment);

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: mockComment,
      });
    });

    it('should throw error on failure', async () => {
      mockRequest = { body: {} };
      const error = new Error('Validation error');
      mockService.create.mockRejectedValue(error);

      await expect(
        controller.create(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow('Validation error');
    });
  });

  describe('update', () => {
    it('should update and return comment', async () => {
      mockRequest = {
        params: { id: mockComment.id },
        body: { content: 'Updated content' },
      };
      const updatedComment = { ...mockComment, content: 'Updated content' };
      mockService.update.mockResolvedValue(updatedComment);

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: updatedComment,
      });
    });

    it('should throw NotFoundError when comment not found', async () => {
      mockRequest = { params: { id: 'non-existent' }, body: { content: 'test' } };
      const error = new NotFoundError('Comment', 'non-existent');
      mockService.update.mockRejectedValue(error);

      await expect(
        controller.update(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete comment and return success', async () => {
      mockRequest = { params: { id: mockComment.id } };
      mockService.delete.mockResolvedValue();

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: 'Comment deleted successfully',
      });
    });

    it('should throw NotFoundError when comment not found', async () => {
      mockRequest = { params: { id: 'non-existent' } };
      const error = new NotFoundError('Comment', 'non-existent');
      mockService.delete.mockRejectedValue(error);

      await expect(
        controller.delete(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
