import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export async function hashPassword(password: string, saltRounds: number): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function sha256Base64Url(input: string): string {
  return crypto.createHash('sha256').update(input).digest('base64url');
}
