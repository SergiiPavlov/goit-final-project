import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

import { HttpError } from './errorHandler.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        new HttpError(400, 'Validation error', {
          code: 'VALIDATION_ERROR',
          details: result.error.flatten(),
        })
      );
    }
    req.body = result.data as unknown;
    next();
  };
}
