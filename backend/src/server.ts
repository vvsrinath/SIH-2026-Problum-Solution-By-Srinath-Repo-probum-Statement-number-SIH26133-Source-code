import http from 'node:http';
import { env, validateEnv } from './config/env';
import logger from './config/logger';
import { connectDatabase } from './config/database';
import { createApp } from './app';
import { initSocketServer } from './sockets/socket';
import { startScheduledJobs, stopScheduledJobs } from './services/scheduler.service';

async function bootstrap() {
  validateEnv();
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  // Socket.IO (E2EE messaging relay + realtime)
  initSocketServer(server);

  // Start scheduled jobs (retention, consent expiry, key expiry)
  if (env.NODE_ENV !== 'test') {
    startScheduledJobs();
  }

  server.listen(env.BACKEND_PORT, () => {
    logger.info(
      { port: env.BACKEND_PORT, env: env.NODE_ENV, ai: env.AI_SERVICE_URL },
      `Swasthya Sathi backend listening`,
    );
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    stopScheduledJobs();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
