import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendError } from '../utils/response';
import type { Request, Response } from 'express';

/** Generic API limiter (generous for reads). */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) =>
    sendError(res, 429, 'RATE_LIMITED', 'Too many requests, please try again later'),
});

/** Stricter limiter for auth flows (login/callback). */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) =>
    sendError(res, 429, 'RATE_LIMITED', 'Too many authentication attempts, please try again later'),
});

/** Stricter limiter for AI assessment to prevent abuse. */
export const aiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) =>
    sendError(res, 429, 'RATE_LIMITED', 'Assessment request limit reached, please try again later'),
});

/** Stricter limiter for privacy requests / consent mutations. */
export const privacyLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) =>
    sendError(res, 429, 'RATE_LIMITED', 'Too many privacy requests, please try again later'),
});

export const appointmentLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) =>
    sendError(res, 429, 'RATE_LIMITED', 'Too many appointment requests, please try again later'),
});
