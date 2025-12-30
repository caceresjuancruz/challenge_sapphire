import 'reflect-metadata';
import { CommentService } from '../../../src/services/comment.service';
import { ICommentRepository } from '../../../src/repositories/interfaces/comment.repository.interface';
import { IEventBus } from '../../../src/events/interfaces/event-bus.interface';
import { Comment } from '../../../src/models/entities/comment.entity';
import { NotFoundError } from '../../../src/utils/errors/not-found.error';
import { PaginatedResult, PaginationOptions } from '../../../src/utils/pagination/pagination.types';
import { EventType } from '../../../src/events/types/domain-events';

describe('CommentService', () => {
  let service: CommentService;
  let mockRepository: jest.Mocked<ICommentRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

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
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findReplies: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteReplies: jest.fn(),
    };

    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    };

    service = new CommentService(mockRepository, mockEventBus);
  });

  describe('findAll', () => {
    it('should return paginated comments', async () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      mockRepository.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await service.findAll(options);

      expect(mockRepository.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should pass pagination options correctly', async () => {
      const options: PaginationOptions = {
        page: 2,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      };
      mockRepository.findAll.mockResolvedValue({
        ...mockPaginatedResult,
        meta: { ...mockPaginatedResult.meta, page: 2, limit: 5 },
      });

      await service.findAll(options);

      expect(mockRepository.findAll).toHaveBeenCalledWith(options);
    });
  });

  describe('findById', () => {
    it('should return comment when found', async () => {
      mockRepository.findById.mockResolvedValue(mockComment);

      const result = await service.findById(mockComment.id);

      expect(mockRepository.findById).toHaveBeenCalledWith(mockComment.id);
      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundError when comment not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundError);
      await expect(service.findById('non-existent-id')).rejects.toThrow(
        'Comment with id non-existent-id not found'
      );
    });
  });

  describe('findReplies', () => {
    it('should return paginated replies when parent exists', async () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      mockRepository.findById.mockResolvedValue(mockComment);
      mockRepository.findReplies.mockResolvedValue(mockPaginatedResult);

      const result = await service.findReplies(mockComment.id, options);

      expect(mockRepository.findById).toHaveBeenCalledWith(mockComment.id);
      expect(mockRepository.findReplies).toHaveBeenCalledWith(mockComment.id, options);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw NotFoundError when parent comment not found', async () => {
      const options: PaginationOptions = { page: 1, limit: 10 };
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findReplies('non-existent-id', options)).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create and return new comment', async () => {
      const createDto = { content: 'New comment', authorId: mockComment.authorId };
      mockRepository.create.mockResolvedValue(mockComment);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockComment);
    });

    it('should emit COMMENT_CREATED event', async () => {
      const createDto = { content: 'New comment', authorId: mockComment.authorId };
      mockRepository.create.mockResolvedValue(mockComment);

      await service.create(createDto);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.COMMENT_CREATED,
          payload: expect.objectContaining({
            commentId: mockComment.id,
            content: mockComment.content,
            authorId: mockComment.authorId,
          }),
        })
      );
    });

    it('should validate parentId exists when provided', async () => {
      const createDto = {
        content: 'Reply',
        authorId: mockComment.authorId,
        parentId: 'parent-id',
      };
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundError);
    });

    it('should create reply when parentId exists', async () => {
      const parentComment = { ...mockComment, id: 'parent-id' };
      const createDto = {
        content: 'Reply',
        authorId: mockComment.authorId,
        parentId: 'parent-id',
      };
      const replyComment = { ...mockComment, parentId: 'parent-id' };

      mockRepository.findById.mockResolvedValue(parentComment);
      mockRepository.create.mockResolvedValue(replyComment);

      const result = await service.create(createDto);

      expect(mockRepository.findById).toHaveBeenCalledWith('parent-id');
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(replyComment);
    });
  });

  describe('createReply', () => {
    it('should create reply when parent exists', async () => {
      const parentComment = { ...mockComment, id: 'parent-id' };
      const createDto = { content: 'Reply content', authorId: 'author-id' };
      const replyComment = { ...mockComment, parentId: 'parent-id' };

      mockRepository.findById.mockResolvedValue(parentComment);
      mockRepository.create.mockResolvedValue(replyComment);

      const result = await service.createReply('parent-id', createDto);

      expect(mockRepository.findById).toHaveBeenCalledWith('parent-id');
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        parentId: 'parent-id',
      });
      expect(result).toEqual(replyComment);
    });

    it('should emit COMMENT_REPLIED event', async () => {
      const parentComment = { ...mockComment, id: 'parent-id', authorId: 'parent-author' };
      const createDto = { content: 'Reply content', authorId: 'reply-author' };
      const replyComment = {
        ...mockComment,
        id: 'reply-id',
        parentId: 'parent-id',
        authorId: 'reply-author',
        content: 'Reply content',
      };

      mockRepository.findById.mockResolvedValue(parentComment);
      mockRepository.create.mockResolvedValue(replyComment);

      await service.createReply('parent-id', createDto);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.COMMENT_REPLIED,
          payload: expect.objectContaining({
            commentId: 'reply-id',
            parentId: 'parent-id',
            parentAuthorId: 'parent-author',
            replyAuthorId: 'reply-author',
          }),
        })
      );
    });

    it('should throw NotFoundError when parent not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.createReply('non-existent', { content: 'Reply', authorId: 'author' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update and return comment when found', async () => {
      const updateDto = { content: 'Updated content' };
      const updatedComment = { ...mockComment, content: 'Updated content' };
      mockRepository.findById.mockResolvedValue(mockComment);
      mockRepository.update.mockResolvedValue(updatedComment);

      const result = await service.update(mockComment.id, updateDto);

      expect(mockRepository.findById).toHaveBeenCalledWith(mockComment.id);
      expect(mockRepository.update).toHaveBeenCalledWith(mockComment.id, updateDto);
      expect(result).toEqual(updatedComment);
    });

    it('should emit COMMENT_UPDATED event', async () => {
      const updateDto = { content: 'Updated content' };
      const updatedComment = { ...mockComment, content: 'Updated content' };
      mockRepository.findById.mockResolvedValue(mockComment);
      mockRepository.update.mockResolvedValue(updatedComment);

      await service.update(mockComment.id, updateDto);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.COMMENT_UPDATED,
          payload: expect.objectContaining({
            commentId: mockComment.id,
            oldContent: mockComment.content,
            newContent: 'Updated content',
            authorId: mockComment.authorId,
          }),
        })
      );
    });

    it('should throw NotFoundError when comment not found on initial check', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { content: 'test' })).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw NotFoundError when update returns null', async () => {
      mockRepository.findById.mockResolvedValue(mockComment);
      mockRepository.update.mockResolvedValue(null);

      await expect(service.update(mockComment.id, { content: 'test' })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('delete', () => {
    it('should delete comment and its replies when found', async () => {
      mockRepository.findById.mockResolvedValue(mockComment);
      mockRepository.deleteReplies.mockResolvedValue(2);
      mockRepository.delete.mockResolvedValue(true);

      await expect(service.delete(mockComment.id)).resolves.toBeUndefined();

      expect(mockRepository.findById).toHaveBeenCalledWith(mockComment.id);
      expect(mockRepository.deleteReplies).toHaveBeenCalledWith(mockComment.id);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockComment.id);
    });

    it('should emit COMMENT_DELETED event', async () => {
      mockRepository.findById.mockResolvedValue(mockComment);
      mockRepository.deleteReplies.mockResolvedValue(0);
      mockRepository.delete.mockResolvedValue(true);

      await service.delete(mockComment.id);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.COMMENT_DELETED,
          payload: expect.objectContaining({
            commentId: mockComment.id,
            authorId: mockComment.authorId,
          }),
        })
      );
    });

    it('should throw NotFoundError when comment not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });
});
