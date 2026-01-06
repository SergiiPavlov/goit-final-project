import type { NextFunction, Request, Response } from 'express';

import { HttpError } from './errorHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';

export type AuthenticatedRequest = Request & { userId: string };

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') || '';
  const [, token] = header.split(' ');
  if (!token) {
    return next(new HttpError(401, 'Missing Authorization header', { code: 'UNAUTHORIZED' }));
  }

  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).userId = payload.sub;
    return next();
  } catch {
    return next(new HttpError(401, 'Invalid or expired access token', { code: 'UNAUTHORIZED' }));
  }
}
