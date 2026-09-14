import { Router } from 'express';
import { login, callback, logout, me, mockLogin } from './auth.controller';
import { requireAuth } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { mockLoginSchema } from './auth.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { authLimiter } from '../../middleware/rateLimit';

const router = Router();

// Authentication endpoints (generous retry protection on the auth flows)
router.get('/login', authLimiter, login);
router.get('/callback', authLimiter, asyncHandler(callback));
router.post('/logout', authLimiter, requireAuth, asyncHandler(logout));

// Dev-only mock login
router.post('/mock-login', authLimiter, validate({ body: mockLoginSchema }), asyncHandler(mockLogin));

router.get('/me', requireAuth, asyncHandler(me));

export default router;
