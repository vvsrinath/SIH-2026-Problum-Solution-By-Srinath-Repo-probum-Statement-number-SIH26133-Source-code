import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const bool = (v: string | undefined) => v === 'true' || v === '1';

const numeric = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== '' ? n : fallback;
};

const list = (v: string | undefined, fallback: string[]) =>
  v
    ? v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BACKEND_PORT: z.coerce.number().default(8000),
  TRUST_PROXY: z.boolean().default(false),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/swasthya_sathi'),
  SESSION_SECRET: z.string().min(1).default('change-me-session-secret'),
  JWT_SECRET: z.string().min(1).default('change-me-jwt-secret'),
  AUTH_PROVIDER: z.enum(['mock', 'meripehchaan']).default('mock'),
  ACCESS_TOKEN_TTL: z.coerce.number().default(900),
  SESSION_TTL_DAYS: z.coerce.number().default(7),
  CORS_ORIGINS: z.array(z.string()).default(['http://localhost:5174', 'http://localhost:5173']),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  AI_RATE_LIMIT_MAX: z.coerce.number().default(20),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
  UPLOAD_MAX_BYTES: z.coerce.number().default(10485760),
  BODY_LIMIT: z.string().default('1mb'),
  RETENTION_AUDIT_DAYS: z.coerce.number().default(3650),
  RETENTION_TRIAGE_DAYS: z.coerce.number().default(730),
  RETENTION_GPS_DAYS: z.coerce.number().default(0),
  REDIS_URL: z.string().optional(),
  AI_SERVICE_URL: z.string().default('http://127.0.0.1:8100'),
  AI_SERVICE_SECRET: z.string().default(''),
  MERIPEHCHAAN_CLIENT_ID: z.string().optional(),
  MERIPEHCHAAN_CLIENT_SECRET: z.string().optional(),
  MERIPEHCHAAN_REDIRECT_URI: z.string().optional(),
  MERIPEHCHAAN_AUTH_URL: z.string().optional(),
  MERIPEHCHAAN_TOKEN_URL: z.string().optional(),
  MERIPEHCHAAN_USERINFO_URL: z.string().optional(),
  BHUVAN_API_BASE_URL: z.string().optional(),
  BHUVAN_API_KEY: z.string().optional(),
  MAPPLS_API_BASE_URL: z.string().optional(),
  MAPPLS_API_KEY: z.string().optional(),
  MAPPLS_CLIENT_ID: z.string().optional(),
  MAPPLS_CLIENT_SECRET: z.string().optional(),
  BHARATVC_BASE_URL: z.string().optional(),
  BHARATVC_CLIENT_ID: z.string().optional(),
  BHARATVC_CLIENT_SECRET: z.string().optional(),
  GOVDRIVE_BASE_URL: z.string().optional(),
  GOVDRIVE_CLIENT_ID: z.string().optional(),
  GOVDRIVE_CLIENT_SECRET: z.string().optional(),
});

const raw = {
  NODE_ENV: process.env.NODE_ENV,
  BACKEND_PORT: process.env.BACKEND_PORT || process.env.PORT || '8000',
  TRUST_PROXY: bool(process.env.TRUST_PROXY),
  MONGODB_URI: process.env.MONGODB_URI,
  SESSION_SECRET: process.env.SESSION_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  AUTH_PROVIDER: process.env.AUTH_PROVIDER,
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL,
  SESSION_TTL_DAYS: process.env.SESSION_TTL_DAYS,
  CORS_ORIGINS: list(process.env.CORS_ORIGINS, ['http://localhost:5173', 'http://localhost:5174']),
  RATE_LIMIT_WINDOW_MS: numeric(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  RATE_LIMIT_MAX: numeric(process.env.RATE_LIMIT_MAX, 300),
  AI_RATE_LIMIT_MAX: numeric(process.env.AI_RATE_LIMIT_MAX, 20),
  AUTH_RATE_LIMIT_MAX: numeric(process.env.AUTH_RATE_LIMIT_MAX, 10),
  UPLOAD_MAX_BYTES: numeric(process.env.UPLOAD_MAX_BYTES, 10485760),
  BODY_LIMIT: process.env.BODY_LIMIT || '1mb',
  RETENTION_AUDIT_DAYS: numeric(process.env.RETENTION_AUDIT_DAYS, 3650),
  RETENTION_TRIAGE_DAYS: numeric(process.env.RETENTION_TRIAGE_DAYS, 730),
  RETENTION_GPS_DAYS: numeric(process.env.RETENTION_GPS_DAYS, 0),
  REDIS_URL: process.env.REDIS_URL,
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8100',
  AI_SERVICE_SECRET: process.env.AI_SERVICE_SECRET || '',
  MERIPEHCHAAN_CLIENT_ID: process.env.MERIPEHCHAAN_CLIENT_ID,
  MERIPEHCHAAN_CLIENT_SECRET: process.env.MERIPEHCHAAN_CLIENT_SECRET,
  MERIPEHCHAAN_REDIRECT_URI: process.env.MERIPEHCHAAN_REDIRECT_URI,
  MERIPEHCHAAN_AUTH_URL: process.env.MERIPEHCHAAN_AUTH_URL,
  MERIPEHCHAAN_TOKEN_URL: process.env.MERIPEHCHAAN_TOKEN_URL,
  MERIPEHCHAAN_USERINFO_URL: process.env.MERIPEHCHAAN_USERINFO_URL,
  BHUVAN_API_BASE_URL: process.env.BHUVAN_API_BASE_URL,
  BHUVAN_API_KEY: process.env.BHUVAN_API_KEY,
  MAPPLS_API_BASE_URL: process.env.MAPPLS_API_BASE_URL,
  MAPPLS_API_KEY: process.env.MAPPLS_API_KEY,
  MAPPLS_CLIENT_ID: process.env.MAPPLS_CLIENT_ID,
  MAPPLS_CLIENT_SECRET: process.env.MAPPLS_CLIENT_SECRET,
  BHARATVC_BASE_URL: process.env.BHARATVC_BASE_URL,
  BHARATVC_CLIENT_ID: process.env.BHARATVC_CLIENT_ID,
  BHARATVC_CLIENT_SECRET: process.env.BHARATVC_CLIENT_SECRET,
  GOVDRIVE_BASE_URL: process.env.GOVDRIVE_BASE_URL,
  GOVDRIVE_CLIENT_ID: process.env.GOVDRIVE_CLIENT_ID,
  GOVDRIVE_CLIENT_SECRET: process.env.GOVDRIVE_CLIENT_SECRET,
};

const parsed = envSchema.parse(raw);

/** Fail fast in production if a mock/unconfigured setup would ship. */
function assertProductionConfig(cfg: typeof parsed) {
  if (cfg.NODE_ENV !== 'production') return;
  const missing: string[] = [];
  if (cfg.AUTH_PROVIDER === 'mock') missing.push('AUTH_PROVIDER must be a real provider in production');
  if (!cfg.SESSION_SECRET || cfg.SESSION_SECRET === 'change-me-session-secret')
    missing.push('SESSION_SECRET must be set');
  if (!cfg.JWT_SECRET || cfg.JWT_SECRET === 'change-me-jwt-secret') missing.push('JWT_SECRET must be set');
  if (!cfg.MONGODB_URI || cfg.MONGODB_URI.startsWith('mongodb://127.0.0.1')) missing.push('MONGODB_URI must be set');
  if (missing.length) throw new Error(`Invalid production configuration: ${missing.join(', ')}`);
}

export const env = parsed;

export function validateEnv() {
  assertProductionConfig(env);
  return env;
}
