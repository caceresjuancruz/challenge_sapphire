import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Type for async request handlers.
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Wraps an async request handler to automatically catch errors
 * and pass them to the next middleware.
 *
 * This enables centralized error handling without try/catch in every controller.
 *
 * @example
 * ```typescript
 * // Instead of:
 * router.get('/:id', async (req, res, next) => {
 *   try {
 *     const comment = await service.findById(req.params.id);
 *     res.json(comment);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // Use:
 * router.get('/:id', asyncHandler(async (req, res) => {
 *   const comment = await service.findById(req.params.id);
 *   res.json(comment);
 * }));
 * ```
 */
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
