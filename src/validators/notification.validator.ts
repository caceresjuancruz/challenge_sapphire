import { z } from 'zod';

export const recipientIdParamSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID format'),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});
