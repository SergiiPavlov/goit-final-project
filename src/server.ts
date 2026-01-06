import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';

const app = createApp();

async function bootstrap() {
  await prisma.$connect();

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[lehlehka-backend] listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[lehlehka-backend] received ${signal}, shutting down...`);

    server.close(async (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('[lehlehka-backend] http server close error', err);
      }
      await prisma.$disconnect();
      process.exit(err ? 1 : 0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[lehlehka-backend] failed to start', err);
  process.exit(1);
});
