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

  app.use('/api/auth', authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
