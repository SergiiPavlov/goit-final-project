import type { Response } from 'express';
import ms, { type StringValue } from 'ms';

import { env } from '../config/env.js';

type TokenPair = { accessToken: string; refreshToken: string };

function toMaxAge(value: StringValue, label: string): number {
  const duration = ms(value);
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Invalid ${label} duration: ${value}`);
  }
  return duration;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge,
  } as const;
}

export function setAuthCookies(res: Response, tokens: TokenPair) {
  const accessMaxAge = toMaxAge(env.jwtAccessTtl as StringValue, 'access token');
  const refreshMaxAge = toMaxAge(env.jwtRefreshTtl as StringValue, 'refresh token');

  res.cookie('accessToken', tokens.accessToken, cookieOptions(accessMaxAge));
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions(refreshMaxAge));
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', cookieOptions(0));
  res.clearCookie('refreshToken', cookieOptions(0));
}
