import { Notification } from '../../database/models/Notification';
import { NotFoundError } from '../../utils/errors';

export async function listMyNotifications(userId: string, opts: { limit: number; offset: number; unreadOnly: boolean }) {
  const filter = { userId, ...(opts.unreadOnly ? { read: false } : {}) };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(opts.offset).limit(opts.limit).lean(),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, read: false }),
  ]);
  return { items, total, unread };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const doc = await Notification.findOneAndUpdate(
    { notificationId, userId },
    { $set: { read: true, readAt: new Date() } },
    { new: true },
  ).lean();
  if (!doc) throw new NotFoundError('Notification not found');
  return doc;
}
