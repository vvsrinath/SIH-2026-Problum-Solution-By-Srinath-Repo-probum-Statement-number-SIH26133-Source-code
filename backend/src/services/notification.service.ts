import { Notification } from '../database/models/Notification';
import { newNotificationId } from '../utils/id';

export interface NotifyInput {
  userId: string;
  type: 'APPOINTMENT' | 'REFERRAL' | 'FOLLOWUP' | 'CONSENT' | 'PRIVACY' | 'GENERAL';
  title: string;
  body?: string;
  link?: string;
}

/**
 * Create a notification. Titles/bodies avoid sensitive medical detail — they
 * are a pointer, not a report.
 */
export async function createNotification(input: NotifyInput) {
  try {
    return await Notification.create({
      notificationId: newNotificationId(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body || '',
      link: input.link,
    });
  } catch (err) {
    console.error('notification write failed', err);
    return null;
  }
}
