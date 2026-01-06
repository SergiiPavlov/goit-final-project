import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../../middleware/auth.js';

import * as authService from './auth.service.js';
import type { LoginInput, LogoutInput, RefreshInput, RegisterInput } from './auth.schemas.js';

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body as RegisterInput);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body as LoginInput);
  res.status(200).json(result);
}

export async function refresh(req: Request, res: Response) {
  const input = req.body as RefreshInput;
  const result = await authService.refresh(input.refreshToken);
  res.status(200).json(result);
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  const input = req.body as LogoutInput;
  const result = await authService.logout(req.userId, input.refreshToken);
  res.status(200).json(result);
}
