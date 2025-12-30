import 'reflect-metadata';
import { InMemoryEventBus } from '../../../src/events/in-memory-event-bus';
import {
  EventType,
  DomainEvent,
  CommentCreatedPayload,
} from '../../../src/events/types/domain-events';

describe('InMemoryEventBus', () => {
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
  });

  describe('emit and on', () => {
    it('should emit event and call registered handler', () => {
      const handler = jest.fn();
      const event: DomainEvent<CommentCreatedPayload> = {
        id: 'event-1',
        type: EventType.COMMENT_CREATED,
        timestamp: new Date(),
        payload: {
          commentId: 'comment-1',
          content: 'Test content',
          authorId: 'author-1',
          parentId: null,
        },
      };

      eventBus.on(EventType.COMMENT_CREATED, handler);
      eventBus.emit(event);

      expect(handler).toHaveBeenCalledWith(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should call multiple handlers for the same event type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const event: DomainEvent<CommentCreatedPayload> = {
        id: 'event-1',
        type: EventType.COMMENT_CREATED,
        timestamp: new Date(),
        payload: {
          commentId: 'comment-1',
          content: 'Test',
          authorId: 'author-1',
          parentId: null,
        },
      };

      eventBus.on(EventType.COMMENT_CREATED, handler1);
      eventBus.on(EventType.COMMENT_CREATED, handler2);
      eventBus.emit(event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should not call handler for different event type', () => {
      const handler = jest.fn();
      const event: DomainEvent<CommentCreatedPayload> = {
        id: 'event-1',
        type: EventType.COMMENT_CREATED,
        timestamp: new Date(),
        payload: {
          commentId: 'comment-1',
          content: 'Test',
          authorId: 'author-1',
          parentId: null,
        },
      };

      eventBus.on(EventType.COMMENT_DELETED, handler);
      eventBus.emit(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove handler and not call it after removal', () => {
      const handler = jest.fn();
      const event: DomainEvent<CommentCreatedPayload> = {
        id: 'event-1',
        type: EventType.COMMENT_CREATED,
        timestamp: new Date(),
        payload: {
          commentId: 'comment-1',
          content: 'Test',
          authorId: 'author-1',
          parentId: null,
        },
      };

      eventBus.on(EventType.COMMENT_CREATED, handler);
      eventBus.off(EventType.COMMENT_CREATED, handler);
      eventBus.emit(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove the specific handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const event: DomainEvent<CommentCreatedPayload> = {
        id: 'event-1',
        type: EventType.COMMENT_CREATED,
        timestamp: new Date(),
        payload: {
          commentId: 'comment-1',
          content: 'Test',
          authorId: 'author-1',
          parentId: null,
        },
      };

      eventBus.on(EventType.COMMENT_CREATED, handler1);
      eventBus.on(EventType.COMMENT_CREATED, handler2);
      eventBus.off(EventType.COMMENT_CREATED, handler1);
      eventBus.emit(event);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith(event);
    });
  });

  describe('async handlers', () => {
    it('should work with async handlers', async () => {
      const asyncHandler = jest.fn().mockResolvedValue(undefined);
      const event: DomainEvent<CommentCreatedPayload> = {
        id: 'event-1',
        type: EventType.COMMENT_CREATED,
        timestamp: new Date(),
        payload: {
          commentId: 'comment-1',
          content: 'Test',
          authorId: 'author-1',
          parentId: null,
        },
      };

      eventBus.on(EventType.COMMENT_CREATED, asyncHandler);
      eventBus.emit(event);

      expect(asyncHandler).toHaveBeenCalledWith(event);
    });

    it('should catch and log errors from async handlers', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Handler error');
      const asyncHandler = jest.fn().mockRejectedValue(error);
      const event: DomainEvent<CommentCreatedPayload> = {
        id: 'event-1',
        type: EventType.COMMENT_CREATED,
        timestamp: new Date(),
        payload: {
          commentId: 'comment-1',
          content: 'Test',
          authorId: 'author-1',
          parentId: null,
        },
      };

      eventBus.on(EventType.COMMENT_CREATED, asyncHandler);
      eventBus.emit(event);

      // Wait for the promise to reject
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(asyncHandler).toHaveBeenCalledWith(event);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Event handler error:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('off with unregistered handler', () => {
    it('should handle off for handler that was never registered', () => {
      const unregisteredHandler = jest.fn();

      // Should not throw
      expect(() => {
        eventBus.off(EventType.COMMENT_CREATED, unregisteredHandler);
      }).not.toThrow();
    });
  });
});
