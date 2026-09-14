import mongoose from 'mongoose';
import { env } from './env';
import logger from './logger';

const MONGODB_URI = env.MONGODB_URI;

/**
 * Connect to MongoDB with a sensible default timeouts. In tests we may want
 * to connect to a mongodb-memory-server or skip the connection; pass
 * `connect = false` for unit tests that do not require a live DB.
 */
export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    logger.info({ uri: redactUri(MONGODB_URI) }, 'MongoDB connected');
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed');
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function redactUri(uri: string): string {
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return '(mongodb uri)';
  }
}

export default mongoose;
