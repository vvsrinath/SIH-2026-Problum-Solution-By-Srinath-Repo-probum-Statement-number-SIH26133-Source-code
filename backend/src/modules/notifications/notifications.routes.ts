import { Router } from 'express';
import { list, markRead } from './notifications.controller';
import { requireAuth } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { notificationListQuerySchema, notificationIdParamsSchema } from './notifications.schema';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/', validate({ query: notificationListQuerySchema }), asyncHandler(list));
router.post('/:id/read', validate({ params: notificationIdParamsSchema }), asyncHandler(markRead));

export default router;
