import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * Notifications intentionally avoid sensitive medical detail in title/body.
 * They are a pointer ("New healthcare notification") rather than a report.
 */
const notificationSchema = new Schema(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['APPOINTMENT', 'REFERRAL', 'FOLLOWUP', 'CONSENT', 'PRIVACY', 'GENERAL'],
      default: 'GENERAL',
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    link: { type: String },
  },
  { timestamps: true },
);
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema>;

export const Notification =
  model('Notification', notificationSchema);
