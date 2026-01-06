import crypto from 'node:crypto';

import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { env } from '../../config/env.js';
import { hashPassword, sha256Base64Url, verifyPassword } from '../../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { addMs, parseDateYYYYMMDD } from '../../utils/time.js';

import type { LoginInput, RegisterInput } from './auth.schemas.js';

type TokenPair = { accessToken: string; refreshToken: string };

type PublicUser = {
  id: string;
  name: string;
  email: string;
  gender: 'boy' | 'girl' | null;
  dueDate: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function toPublicUser(user: any): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    gender: user.gender ?? null,
    dueDate: user.dueDate ? user.dueDate.toISOString().slice(0, 10) : null,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

async function createSessionAndTokens(userId: string): Promise<{ tokens: TokenPair; sessionId: string }> {
  const session = await prisma.session.create({
    data: {
      userId,
      // Temporary unique value; will be replaced immediately after we build the refresh JWT.
      refreshTokenHash: `temp-${crypto.randomUUID()}`,
      expiresAt: addMs(new Date(), env.jwtRefreshTtl),
    },
    select: { id: true },
  });

  const refreshToken = signRefreshToken(userId, session.id);
  const refreshTokenHash = sha256Base64Url(refreshToken);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash,
      expiresAt: addMs(new Date(), env.jwtRefreshTtl),
    },
  });

  const accessToken = signAccessToken(userId);

  return { tokens: { accessToken, refreshToken }, sessionId: session.id };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, 'Email already in use', { code: 'EMAIL_TAKEN' });
  }

  const passwordHash = await hashPassword(input.password, env.bcryptSaltRounds);

  const dueDate = input.dueDate ? parseDateYYYYMMDD(input.dueDate) : null;

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      gender: input.gender ?? null,
      dueDate,
    },
  });

  const { tokens } = await createSessionAndTokens(user.id);

  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new HttpError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }

  const { tokens } = await createSessionAndTokens(user.id);

  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  // Verify token signature + extract sessionId
  let payload: { sub: string; sessionId: string };
  try {
    const verified = verifyRefreshToken(refreshToken);
    payload = { sub: verified.sub, sessionId: verified.sessionId };
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token', { code: 'UNAUTHORIZED' });
  }

  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.userId !== payload.sub) {
    throw new HttpError(401, 'Invalid or expired refresh token', { code: 'UNAUTHORIZED' });
  }

  if (session.expiresAt.getTime() < Date.now()) {
    // Cleanup
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    throw new HttpError(401, 'Refresh token expired', { code: 'UNAUTHORIZED' });
  }

  const incomingHash = sha256Base64Url(refreshToken);
  if (incomingHash !== session.refreshTokenHash) {
    // Possible replay -> invalidate session
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    throw new HttpError(401, 'Invalid or expired refresh token', { code: 'UNAUTHORIZED' });
  }

  // Rotate refresh token in the same session: old token becomes invalid
  const newRefreshToken = signRefreshToken(payload.sub, session.id);
  const newRefreshHash = sha256Base64Url(newRefreshToken);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: newRefreshHash,
      expiresAt: addMs(new Date(), env.jwtRefreshTtl),
    },
  });

  const accessToken = signAccessToken(payload.sub);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string, refreshToken?: string) {
  if (refreshToken) {
    const hash = sha256Base64Url(refreshToken);
    await prisma.session.deleteMany({ where: { userId, refreshTokenHash: hash } });
    return { ok: true, scope: 'single' as const };
  }

  await prisma.session.deleteMany({ where: { userId } });
  return { ok: true, scope: 'all' as const };
}
