import { env } from '../../config/env';
import logger from '../../config/logger';
import { UnavailableError, NotFoundError, ForbiddenError } from '../../utils/errors';

/**
 * GovDrive — government-grade encrypted document vault. The Node backend
 * stores only encrypted blobs and never plaintext; decryption keys are held
 * on the client. When the service is not configured, every operation returns
 * explicit unavailable/forbidden states instead of failing silently.
 */

export interface StorageAdapter {
  put(input: {
    ownerId: string;
    context: string;
    filename: string;
    mime: string;
    ciphertext: Buffer;
    nonce: string;
    contentType?: string;
  }): Promise<{ refId: string }>;
  get(ownerId: string, refId: string): Promise<{ ciphertext: Buffer; mime: string; nonce: string }>;
  delete(ownerId: string, refId: string): Promise<void>;
  list(ownerId: string): Promise<Array<{ refId: string; filename: string; mime: string; createdAt: string }>>;
}

export function govdriveStorageUnavailable(): StorageAdapter {
  const unavailable = (): never => {
    throw new UnavailableError('Encrypted storage is temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
  };
  return {
    put: () => {
      unavailable();
      return Promise.resolve({ refId: '' });
    },
    get: () => {
      unavailable();
      return Promise.resolve({ ciphertext: Buffer.alloc(0), mime: '', nonce: '' });
    },
    delete: () => {
      unavailable();
      return Promise.resolve();
    },
    list: () => {
      unavailable();
      return Promise.resolve([]);
    },
  };
}

export function createGovDriveAdapter(): StorageAdapter {
  const { GOVDRIVE_BASE_URL, GOVDRIVE_CLIENT_ID, GOVDRIVE_CLIENT_SECRET } = env;
  if (!GOVDRIVE_BASE_URL || !GOVDRIVE_CLIENT_ID || !GOVDRIVE_CLIENT_SECRET) {
    logger.warn('GovDrive adapter running unavailable (not configured)');
    return govdriveStorageUnavailable();
  }

  return {
    async put(input) {
      try {
        const base = GOVDRIVE_BASE_URL.replace(/\/$/, '');
        const res = await fetch(`${base}/api/v1/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-GovDrive-Org': GOVDRIVE_CLIENT_ID,
            'X-GovDrive-Secret': GOVDRIVE_CLIENT_SECRET,
          },
          body: JSON.stringify({
            ownerId: input.ownerId,
            context: input.context,
            filename: input.filename,
            mime: input.mime,
            contentType: input.contentType || 'application/octet-stream',
            ciphertext: input.ciphertext.toString('base64'),
            nonce: input.nonce,
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) {
          if (res.status === 403) throw new ForbiddenError('Storage provider rejected the upload');
          if (res.status === 404) throw new NotFoundError('Storage provider unavailable');
          throw new Error(`GovDrive upload failed (${res.status})`);
        }
        const data = (await res.json()) as { refId?: string };
        if (!data.refId) throw new Error('GovDrive missing refId');
        return { refId: data.refId };
      } catch (err) {
        logger.warn({ err }, 'GovDrive put failed');
        throw new UnavailableError('Encrypted storage is temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
      }
    },

    async get(ownerId, refId) {
      try {
        const base = GOVDRIVE_BASE_URL.replace(/\/$/, '');
        const res = await fetch(`${base}/api/v1/files/${encodeURIComponent(refId)}`, {
          headers: {
            'X-GovDrive-Org': GOVDRIVE_CLIENT_ID,
            'X-GovDrive-Secret': GOVDRIVE_CLIENT_SECRET,
            'X-GovDrive-Owner': ownerId,
          },
          signal: AbortSignal.timeout(30000),
        });
        if (res.status === 403) throw new ForbiddenError('You cannot access this file');
        if (res.status === 404) throw new NotFoundError('File not found');
        if (!res.ok) throw new Error(`GovDrive fetch failed (${res.status})`);
        const data = (await res.json()) as {
          ciphertext?: string;
          mime?: string;
          nonce?: string;
        };
        if (!data.ciphertext) throw new Error('GovDrive empty payload');
        return {
          ciphertext: Buffer.from(data.ciphertext, 'base64'),
          mime: data.mime || 'application/octet-stream',
          nonce: data.nonce || '',
        };
      } catch (err) {
        if (err instanceof ForbiddenError || err instanceof NotFoundError) throw err;
        logger.warn({ err }, 'GovDrive get failed');
        throw new UnavailableError('Encrypted storage is temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
      }
    },

    async delete(ownerId, refId) {
      try {
        const base = GOVDRIVE_BASE_URL.replace(/\/$/, '');
        const res = await fetch(`${base}/api/v1/files/${encodeURIComponent(refId)}`, {
          method: 'DELETE',
          headers: {
            'X-GovDrive-Org': GOVDRIVE_CLIENT_ID,
            'X-GovDrive-Secret': GOVDRIVE_CLIENT_SECRET,
            'X-GovDrive-Owner': ownerId,
          },
          signal: AbortSignal.timeout(30000),
        });
        if (res.status === 403) throw new ForbiddenError('You cannot delete this file');
        if (res.status === 404) throw new NotFoundError('File not found');
        if (!res.ok) throw new Error(`GovDrive delete failed (${res.status})`);
      } catch (err) {
        if (err instanceof ForbiddenError || err instanceof NotFoundError) throw err;
        logger.warn({ err }, 'GovDrive delete failed');
        throw new UnavailableError('Encrypted storage is temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
      }
    },

    async list(ownerId) {
      try {
        const base = GOVDRIVE_BASE_URL.replace(/\/$/, '');
        const res = await fetch(`${base}/api/v1/files?ownerId=${encodeURIComponent(ownerId)}`, {
          headers: {
            'X-GovDrive-Org': GOVDRIVE_CLIENT_ID,
            'X-GovDrive-Secret': GOVDRIVE_CLIENT_SECRET,
          },
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) throw new Error(`GovDrive list failed (${res.status})`);
        const data = (await res.json()) as Array<{
          refId: string;
          filename: string;
          mime: string;
          createdAt: string;
        }>;
        return data;
      } catch (err) {
        logger.warn({ err }, 'GovDrive list failed');
        throw new UnavailableError('Encrypted storage is temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
      }
    },
  };
}
