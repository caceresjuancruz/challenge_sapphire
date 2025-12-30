export enum EventType {
  COMMENT_CREATED = 'comment.created',
  COMMENT_UPDATED = 'comment.updated',
  COMMENT_DELETED = 'comment.deleted',
  COMMENT_REPLIED = 'comment.replied',
}

export interface DomainEvent<T = unknown> {
  id: string;
  type: EventType;
  timestamp: Date;
  payload: T;
  metadata?: Record<string, unknown>;
}

export interface CommentCreatedPayload {
  commentId: string;
  content: string;
  authorId: string;
  parentId: string | null;
}

export interface CommentUpdatedPayload {
  commentId: string;
  oldContent: string;
  newContent: string;
  authorId: string;
}

export interface CommentDeletedPayload {
  commentId: string;
  authorId: string;
}

export interface CommentRepliedPayload {
  commentId: string;
  parentId: string;
  parentAuthorId: string;
  replyAuthorId: string;
  content: string;
}

export type CommentEventPayload =
  | CommentCreatedPayload
  | CommentUpdatedPayload
  | CommentDeletedPayload
  | CommentRepliedPayload;
