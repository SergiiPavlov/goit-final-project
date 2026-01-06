import type { Gender, User } from '@prisma/client';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../db/prisma.js';
import { parseMultipartSingleFile } from '../../utils/multipart.js';

export type PublicUserDto = {
  id: string;
  name: string;
  email: string;
  gender: Gender | null;
  dueDate: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function toPublicUser(user: User): PublicUserDto {
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

export async function getCurrentUser(userId: string): Promise<PublicUserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    // @ts-expect-error attach code for error handler
    err.status = 404;
    throw err;
  }
  return toPublicUser(user);
}

export type UpdateUserInput = {
  name?: string;
  gender?: Gender | null;
  dueDate?: string | null;
};

export async function updateUser(userId: string, input: UpdateUserInput): Promise<PublicUserDto> {
  const data: Record<string, unknown> = {};
  if (typeof input.name !== 'undefined') data.name = input.name;
  if (typeof input.gender !== 'undefined') data.gender = input.gender;
  if (typeof input.dueDate !== 'undefined') {
    data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return toPublicUser(user);
}

export type AvatarUploadInput = {
  contentType: string;
  body: Buffer;
};

const AVATAR_DIR = path.resolve(process.cwd(), 'uploads', 'avatars');

function extFromMime(mime: string): string | null {
  const m = mime.toLowerCase();
  if (m === 'image/jpeg' || m === 'image/jpg') return '.jpg';
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/gif') return '.gif';
  return null;
}

export async function updateAvatarFile(userId: string, input: AvatarUploadInput): Promise<PublicUserDto> {
  const file = parseMultipartSingleFile({
    contentType: input.contentType,
    body: input.body,
    fieldName: 'avatar',
  });

  if (!file) {
    const err = new Error('Avatar file is required');
    // @ts-expect-error attach code for error handler
    err.status = 400;
    throw err;
  }

  const mime = file.contentType || 'application/octet-stream';
  const ext = extFromMime(mime) || path.extname(file.filename || '');
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase()) ? ext.toLowerCase() : null;
  if (!safeExt) {
    const err = new Error('Unsupported avatar file type');
    // @ts-expect-error attach code for error handler
    err.status = 400;
    throw err;
  }

  // 5MB limit already enforced at the router layer, but keep a guard.
  if (file.data.length === 0 || file.data.length > 5 * 1024 * 1024) {
    const err = new Error('Invalid avatar size');
    // @ts-expect-error attach code for error handler
    err.status = 400;
    throw err;
  }

  await fs.mkdir(AVATAR_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}${safeExt === '.jpeg' ? '.jpg' : safeExt}`;
  const filePath = path.join(AVATAR_DIR, filename);
  await fs.writeFile(filePath, file.data);

  const avatarUrl = `/uploads/avatars/${filename}`;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });
  return toPublicUser(user);
}
