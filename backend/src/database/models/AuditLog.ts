import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * Append-only audit trail. Never logs E2EE plaintext, passwords, tokens,
 * API secrets, encryption keys, or unnecessary medical data.
 */
const auditLogSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    actorUserId: { type: String, index: true },
    actorRole: { type: String },
    action: { type: String, required: true, index: true },
    resourceType: { type: String },
    resourceId: { type: String },
    result: { type: String, enum: ['SUCCESS', 'FAILURE', 'DENIED'], required: true },
    requestId: { type: String, index: true },
    ip: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);
auditLogSchema.index({ actorUserId: 1, createdAt: -1 });
auditLogSchema.index({ timestamp: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema>;

export const AuditLog =
  model('AuditLog', auditLogSchema);
