import { EventType } from '../../events/types/domain-events.js';

export interface Notification {
  id: string;
  type: EventType;
  title: string;
  message: string;
  recipientId: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date;
}
