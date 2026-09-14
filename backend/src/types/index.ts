import type { Role } from '../constants/roles';

/** Authenticated principal attached to the request by the auth middleware. */
export interface RequestUser {
  internalUserId: string;
  role: Role;
  sessionId: string;
  /** external identity reference when the caller came through MeriPehchaan */
  externalIdentityReference?: string;
}

/** Shape carried on Express request via augmentation (see express.d.ts). */
export interface AuthenticatedRequestExtra {
  auth?: RequestUser;
  requestId: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
