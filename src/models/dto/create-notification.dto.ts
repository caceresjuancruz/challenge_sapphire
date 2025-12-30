import { EventType } from '../../events/types/domain-events.js';

export interface CreateNotificationDto {
  type: EventType;
  title: string;
  message: string;
  recipientId: string;
  metadata?: Record<string, unknown>;
}
