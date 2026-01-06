import type { NextFunction, Request, Response } from 'express';

export type ErrorResponse = {
  message: string;
  code?: string;
  details?: unknown;
};

export class HttpError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(status: number, message: string, opts?: { code?: string; details?: unknown }) {
    super(message);
    this.status = status;
    this.code = opts?.code;
    this.details = opts?.details;
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const isHttp = err instanceof HttpError;

  const status = isHttp ? err.status : 500;
  const payload: ErrorResponse = {
    message: isHttp ? err.message : 'Internal Server Error',
    code: isHttp ? err.code : 'INTERNAL_ERROR',
    details: isHttp ? err.details : undefined,
  };

  res.status(status).json(payload);
}
