import 'reflect-metadata';
import { CommentRepository } from '../../../src/repositories/comment.repository';

describe('CommentRepository', () => {
  let repository: CommentRepository;

  beforeEach(() => {
    repository = new CommentRepository();
  });

  describe('findAll', () => {
    it('should return empty result initially', async () => {
      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should return paginated data', async () => {
      await repository.create({ content: 'Comment 1', authorId: 'author-1' });
      await repository.create({ content: 'Comment 2', authorId: 'author-2' });
      await repository.create({ content: 'Comment 3', authorId: 'author-3' });

      const result = await repository.findAll({ page: 1, limit: 2 });

      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should sort by createdAt descending by default', async () => {
      const comment1 = await repository.create({ content: 'First', authorId: 'author' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const comment2 = await repository.create({ content: 'Second', authorId: 'author' });

      const result = await repository.findAll({ page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data[0].id).toBe(comment2.id);
      expect(result.data[1].id).toBe(comment1.id);
    });

    it('should sort by createdAt ascending when specified', async () => {
      const comment1 = await repository.create({ content: 'First', authorId: 'author' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const comment2 = await repository.create({ content: 'Second', authorId: 'author' });

      const result = await repository.findAll({ page: 1, limit: 10, sortOrder: 'asc' });

      expect(result.data[0].id).toBe(comment1.id);
      expect(result.data[1].id).toBe(comment2.id);
    });

    it('should sort by updatedAt when specified', async () => {
      const comment1 = await repository.create({ content: 'First', authorId: 'author' });
      await repository.create({ content: 'Second', authorId: 'author' });
      await repository.update(comment1.id, { content: 'Updated First' });

      const result = await repository.findAll({
        page: 1,
        limit: 10,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });

      expect(result.data[0].id).toBe(comment1.id);
    });
  });

  describe('findById', () => {
    it('should return null for non-existent comment', async () => {
      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return comment when found', async () => {
      const created = await repository.create({ content: 'Test', authorId: 'author' });

      const result = await repository.findById(created.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.content).toBe('Test');
    });
  });

  describe('create', () => {
    it('should create comment with UUID and timestamps', async () => {
      const result = await repository.create({ content: 'Test', authorId: 'author-id' });

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(result.content).toBe('Test');
      expect(result.authorId).toBe('author-id');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should store comment in repository', async () => {
      const created = await repository.create({ content: 'Test', authorId: 'author' });
      const found = await repository.findById(created.id);

      expect(found).toEqual(created);
    });
  });

  describe('update', () => {
    it('should return null for non-existent comment', async () => {
      const result = await repository.update('non-existent', { content: 'Updated' });
      expect(result).toBeNull();
    });

    it('should update content and updatedAt', async () => {
      const created = await repository.create({ content: 'Original', authorId: 'author' });
      const originalUpdatedAt = created.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      const updated = await repository.update(created.id, { content: 'Updated' });

      expect(updated).not.toBeNull();
      expect(updated?.content).toBe('Updated');
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(updated?.createdAt).toEqual(created.createdAt);
    });

    it('should preserve other fields when updating', async () => {
      const created = await repository.create({ content: 'Original', authorId: 'author-id' });
      const updated = await repository.update(created.id, { content: 'Updated' });

      expect(updated?.authorId).toBe('author-id');
      expect(updated?.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('should return false for non-existent comment', async () => {
      const result = await repository.delete('non-existent');
      expect(result).toBe(false);
    });

    it('should return true and remove comment when exists', async () => {
      const created = await repository.create({ content: 'Test', authorId: 'author' });

      const result = await repository.delete(created.id);
      const found = await repository.findById(created.id);

      expect(result).toBe(true);
      expect(found).toBeNull();
    });
  });

  describe('findReplies', () => {
    it('should return empty result when no replies exist', async () => {
      const parent = await repository.create({ content: 'Parent', authorId: 'author' });

      const result = await repository.findReplies(parent.id, { page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should return only replies to the specified parent', async () => {
      const parent1 = await repository.create({ content: 'Parent 1', authorId: 'author' });
      const parent2 = await repository.create({ content: 'Parent 2', authorId: 'author' });
      await repository.create({
        content: 'Reply to Parent 1',
        authorId: 'author',
        parentId: parent1.id,
      });
      await repository.create({
        content: 'Reply to Parent 2',
        authorId: 'author',
        parentId: parent2.id,
      });

      const result = await repository.findReplies(parent1.id, { page: 1, limit: 10 });

      expect(result.data.length).toBe(1);
      expect(result.data[0].content).toBe('Reply to Parent 1');
      expect(result.data[0].parentId).toBe(parent1.id);
    });

    it('should paginate replies correctly', async () => {
      const parent = await repository.create({ content: 'Parent', authorId: 'author' });
      await repository.create({ content: 'Reply 1', authorId: 'author', parentId: parent.id });
      await repository.create({ content: 'Reply 2', authorId: 'author', parentId: parent.id });
      await repository.create({ content: 'Reply 3', authorId: 'author', parentId: parent.id });

      const result = await repository.findReplies(parent.id, { page: 1, limit: 2 });

      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
    });
  });

  describe('deleteReplies', () => {
    it('should return 0 when no replies exist', async () => {
      const parent = await repository.create({ content: 'Parent', authorId: 'author' });

      const count = await repository.deleteReplies(parent.id);

      expect(count).toBe(0);
    });

    it('should delete all replies and return count', async () => {
      const parent = await repository.create({ content: 'Parent', authorId: 'author' });
      await repository.create({ content: 'Reply 1', authorId: 'author', parentId: parent.id });
      await repository.create({ content: 'Reply 2', authorId: 'author', parentId: parent.id });

      const count = await repository.deleteReplies(parent.id);
      const replies = await repository.findReplies(parent.id, { page: 1, limit: 10 });

      expect(count).toBe(2);
      expect(replies.data.length).toBe(0);
    });

    it('should not delete replies from other parents', async () => {
      const parent1 = await repository.create({ content: 'Parent 1', authorId: 'author' });
      const parent2 = await repository.create({ content: 'Parent 2', authorId: 'author' });
      await repository.create({ content: 'Reply to P1', authorId: 'author', parentId: parent1.id });
      await repository.create({ content: 'Reply to P2', authorId: 'author', parentId: parent2.id });

      await repository.deleteReplies(parent1.id);
      const replies = await repository.findReplies(parent2.id, { page: 1, limit: 10 });

      expect(replies.data.length).toBe(1);
    });
  });

  describe('findAll with nested comments', () => {
    it('should only return root comments (no parentId)', async () => {
      const parent = await repository.create({ content: 'Parent', authorId: 'author' });
      await repository.create({ content: 'Reply', authorId: 'author', parentId: parent.id });

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe(parent.id);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('create with parentId', () => {
    it('should create comment with parentId', async () => {
      const parent = await repository.create({ content: 'Parent', authorId: 'author' });
      const reply = await repository.create({
        content: 'Reply',
        authorId: 'author',
        parentId: parent.id,
      });

      expect(reply.parentId).toBe(parent.id);
      expect(reply.content).toBe('Reply');
    });

    it('should create root comment with null parentId', async () => {
      const comment = await repository.create({ content: 'Root', authorId: 'author' });

      expect(comment.parentId).toBeNull();
    });
  });
});
