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
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
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
};
