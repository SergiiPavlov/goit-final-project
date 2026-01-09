import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { clearAuthCookies, setAuthCookies } from '../../utils/authCookies.js';

import * as authService from './auth.service.js';
import type { LoginInput, LogoutInput, RefreshInput, RegisterInput } from './auth.schemas.js';

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body as RegisterInput);
  setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body as LoginInput);
  setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  res.status(200).json(result);
}

export async function refresh(req: Request, res: Response) {
  const input = req.body as RefreshInput;
  const refreshToken = input.refreshToken ?? req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new HttpError(401, 'Missing refresh token', { code: 'UNAUTHORIZED' });
  }
  const result = await authService.refresh(refreshToken);
  setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  res.status(200).json(result);
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  const input = req.body as LogoutInput;
  const refreshToken = input.refreshToken ?? req.cookies?.refreshToken;
  const result = await authService.logout(req.userId, refreshToken);
  clearAuthCookies(res);
  res.status(200).json(result);
}
