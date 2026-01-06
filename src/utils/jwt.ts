import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AccessTokenPayload = {
  sub: string;
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  type: 'refresh';
};

export function signAccessToken(userId: string): string {
  const payload: AccessTokenPayload = { sub: userId, type: 'access' };
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });
}

export function signRefreshToken(userId: string, sessionId: string): string {
  const payload: RefreshTokenPayload = { sub: userId, sessionId, type: 'refresh' };
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
  if (!payload || payload.type !== 'access' || typeof payload.sub !== 'string') {
    throw new Error('Invalid access token payload');
  }
  return payload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
  if (!payload || payload.type !== 'refresh' || typeof payload.sub !== 'string' || typeof payload.sessionId !== 'string') {
    throw new Error('Invalid refresh token payload');
  }
  return payload;
}
