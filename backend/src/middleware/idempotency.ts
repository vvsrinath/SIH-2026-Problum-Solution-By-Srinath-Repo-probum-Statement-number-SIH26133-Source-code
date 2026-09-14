/**
 * Idempotency middleware.
 *
 * For write operations that should not be blindly replayed (appointment
 * creation, referral actions, consent actions, other workflow mutations),
 * wrap the route: a client-provided `Idempotency-Key` is stored in MongoDB on
 * first processing; a duplicate submission returns the stored response without
 * re-running the handler.
 */

import { createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { Idempotency, type IdempotencyDoc } from '../database/models/Idempotency';
import { ConflictError } from '../utils/errors';
import logger from '../config/logger';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function bodyHash(req: Request): string {
  return createHash('sha256')
    .update(req.method + req.originalUrl + JSON.stringify(req.body ?? {}))
    .digest('hex');
}

function expiresAt(): Date {
  return new Date(Date.now() + IDEMPOTENCY_TTL_MS);
}

/**
 * Enables idempotent processing for a route. If the same key is seen again
 * within the TTL, returns the previous result. Throws ConflictError when the
 * same key is reused with a different request body (probable key collision).
 */
export function idempotent() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers['idempotency-key'];
    const key = typeof header === 'string' && header.length > 0 ? header : undefined;
    if (!key) return next();

    if (!req.auth?.internalUserId) return next();

    const hash = bodyHash(req);

    // Fast integer attempt to reserve the key; unique index prevents races.
    try {
      const existing = (await Idempotency.findOne({
        idempotencyKey: key,
        userId: req.auth.internalUserId,
      }).lean()) as IdempotencyDoc | null;

      if (existing) {
        if (existing.requestHash !== hash) {
          return next(new ConflictError('Idempotency key reused with a different request'));
        }
        // Replay the stored response.
        res.status(existing.statusCode);
        return res.json(existing.responseBody);
      }

      const created = await Idempotency.create({
        idempotencyKey: key,
        userId: req.auth.internalUserId,
        method: req.method,
        path: req.originalUrl,
        requestHash: hash,
        statusCode: 0,
        expiresAt: expiresAt(),
      });

      res.on('finish', () => {
        if (res.statusCode >= 400) {
          Idempotency.deleteOne({ _id: (created as any)._id }).catch(() => undefined);
          return;
        }
        Idempotency.updateOne(
          { _id: (created as any)._id },
          { $set: { statusCode: res.statusCode, responseBody: (res as any).__out } },
        ).catch((err) => logger.warn({ err: err.message }, 'idempotency persist failed'));
      });

      // Capture the response body for replay.
      const origJson = res.json.bind(res);
      const self = res as any;
      self.__out = {};
      res.json = (body: unknown) => {
        self.__out = body;
        return origJson(body);
      };

      return next();
    } catch (err: any) {
      if (err?.code === 11000) {
        // Concurrent duplicate — another request won the key.
        const winner = (await Idempotency.findOne({
          idempotencyKey: key,
          userId: req.auth.internalUserId,
        }).lean()) as IdempotencyDoc | null;
        if (winner && winner.responseBody) {
          res.status(winner.statusCode);
          return res.json(winner.responseBody);
        }
        return next(new ConflictError('Concurrent duplicate request'));
      }
      logger.warn({ err: err?.message }, 'idempotency error');
      return next();
    }
  };
}
