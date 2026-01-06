import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { prisma } from './db/prisma.js';
import { authRouter } from './modules/auth/auth.router.js';
import { usersRouter } from './modules/users/users.router.js';
import { tasksRouter } from './modules/tasks/tasks.router.js';
import { diariesRouter } from './modules/diaries/diaries.router.js';
import { emotionsRouter } from './modules/emotions/emotions.router.js';
import { weeksRouter } from './modules/weeks/weeks.router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  // Optional DB health check (handy for deploy).
  app.get('/health/db', async (_req, res, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  const openapiPath = path.join(__dirname, '../docs/openapi.yaml');
  const spec = YAML.load(openapiPath);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

  // Serve uploaded files (avatars) in dev/prod.
  // Files are saved to <projectRoot>/uploads/...
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/diaries', diariesRouter);
  app.use('/api/emotions', emotionsRouter);
  app.use('/api/weeks', weeksRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
