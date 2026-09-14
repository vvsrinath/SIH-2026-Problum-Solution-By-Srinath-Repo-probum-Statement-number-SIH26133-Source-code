import pino from 'pino';
import { env } from './env';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.token',
  'req.body.secret',
  '*.message.ciphertext',
  '"*.ciphertext"',
  'password',
  'token',
  'jwt',
  'apiKey',
  'secret',
  'keys',
];

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  base: { service: 'swasthya-sathi-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/** Create a child logger bound to an operation/request id. */
export function requestLogger(requestId: string) {
  return logger.child({ requestId });
}

export default logger;
