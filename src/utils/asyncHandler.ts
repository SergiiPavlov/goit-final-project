import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Small helper to avoid repeating try/catch in async route handlers.
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}
