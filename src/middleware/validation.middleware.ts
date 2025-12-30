import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, ValidationIssue } from '../utils/errors/index.js';

type ValidationTarget = 'body' | 'query' | 'params';

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: Record<string, unknown>;
    }
  }
}

/**
 * Middleware factory for validating request data using Zod schemas.
 * Converts Zod validation errors to ValidationError with detailed issues.
 */
export function validate(schema: z.ZodType, target: ValidationTarget = 'body') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await schema.parseAsync(req[target]);

      if (target === 'query') {
        req.validatedQuery = data as Record<string, unknown>;
      } else if (target === 'body') {
        req.body = data;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const targetData = req[target] as Record<string, unknown> | undefined;
        const issues: ValidationIssue[] = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          value: issue.path.length > 0 ? targetData?.[String(issue.path[0])] : undefined,
        }));

        next(new ValidationError(issues));
      } else {
        next(error);
      }
    }
  };
}
