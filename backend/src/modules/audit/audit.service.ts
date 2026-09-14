import { AuditLog } from '../../database/models/AuditLog';

export interface AuditQuery {
  limit: number;
  offset: number;
  actorUserId?: string;
  action?: string;
  result?: string;
}

export async function queryAuditLog(q: AuditQuery) {
  const filter: Record<string, unknown> = {};
  if (q.actorUserId) filter.actorUserId = q.actorUserId;
  if (q.action) filter.action = q.action;
  if (q.result) filter.result = q.result;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(q.offset).limit(q.limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { items, total };
}
