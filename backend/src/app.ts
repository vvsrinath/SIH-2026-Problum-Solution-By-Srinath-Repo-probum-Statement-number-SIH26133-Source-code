import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import logger from './config/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { csrfProtection } from './middleware/csrf';
import { generalLimiter } from './middleware/rateLimit';
import { openapiSpec } from './config/openapi';
import healthRouter from './modules/health/health.controller';
import v1Router from './routes';
import { sendSuccess } from './utils/response';

export interface AppOptions {
  /** Mount a JSON lobby at `/` so an un-qualified host (e.g. a Vercel
   *  deployment root) returns service metadata instead of 404. */
  mountLobby?: boolean;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();

  // Trust a single reverse proxy hop so req.ip / rate limiting honour
  // X-Forwarded-For. Off by default in local dev.
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(cookieParser());
  app.use(csrfProtection);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // CORS: restrict to configured origins
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) return cb(null, true);
        return cb(new Error('Origin not allowed'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-AI-Service-Secret', 'X-CSRF-Token'],
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: env.BODY_LIMIT }));

  // Structured request logging (sensitive bodies redacted by pino config)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
          userId: req.auth?.internalUserId,
        },
        'request',
      );
    });
    next();
  });

  // General rate limit for all API traffic
  app.use('/api', generalLimiter);

  // Swagger / OpenAPI docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { explorer: true }));

  // Routes (versioned under /api/v1)
  if (options.mountLobby) {
    app.get('/', (_req, res) => {
      sendSuccess(res, {
        status: 'ok',
        service: 'swasthya-sathi-backend',
        version: '1.0.0',
        environment: env.NODE_ENV,
        endpoints: { health: '/health', ready: '/ready', api: '/api/v1', docs: '/docs' },
      });
    });
  }
  app.use(healthRouter);
  app.use('/api/v1', v1Router);

  // 404 + error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Express app for serverless hosts (Vercel). The hosted backend entry point:
 * identical to `createApp()` plus a `/` lobby so the deployment root responds.
 */
export function createServerlessApp(): Express {
  return createApp({ mountLobby: true });
}
