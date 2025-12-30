import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters')
    .trim(),
  authorId: z.string().uuid('Invalid author ID format'),
  parentId: z.string().uuid('Invalid parent ID format').optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters')
    .trim(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
