import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default(''),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // PR-04: Auth
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET is required (min 16 chars)'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET is required (min 16 chars)'),
  JWT_ACCESS_TTL: z.string().min(1, 'JWT_ACCESS_TTL is required (e.g. 15m)'),
  JWT_REFRESH_TTL: z.string().min(1, 'JWT_REFRESH_TTL is required (e.g. 30d)'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),

  // NOTE: do NOT use z.coerce.boolean() for env flags.
  // It treats any non-empty string (including "false") as true.
  // We explicitly parse common string values instead.
  COOKIE_SECURE: z
    .preprocess((v) => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (s === '') return undefined;
        if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
        if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
      }
      return v;
    }, z.boolean())
    .optional(),
  COOKIE_SAMESITE: z.enum(['lax', 'none', 'strict']).optional(),

  // Cloudinary (optional, for avatar uploads)
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  CLOUDINARY_FOLDER: z.string().optional().default('avatars'),

  // Default avatar URL (served by Cloudinary or any public CDN)
  // If not provided, avatarUrl will remain null until user uploads one.
  DEFAULT_AVATAR_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[env] Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Check your .env file.');
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  jwtAccessSecret: parsed.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
  jwtAccessTtl: parsed.data.JWT_ACCESS_TTL,
  jwtRefreshTtl: parsed.data.JWT_REFRESH_TTL,
  bcryptSaltRounds: parsed.data.BCRYPT_SALT_ROUNDS,

  cookieSecure: parsed.data.COOKIE_SECURE ?? parsed.data.NODE_ENV === 'production',
  cookieSameSite:
    parsed.data.COOKIE_SAMESITE ?? (parsed.data.NODE_ENV === 'production' ? 'none' : 'lax'),

  cloudinary: {
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
    folder: parsed.data.CLOUDINARY_FOLDER,
  },

  defaultAvatarUrl: parsed.data.DEFAULT_AVATAR_URL,
};
