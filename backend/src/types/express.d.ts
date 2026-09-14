import type { Role } from '../constants/roles';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        internalUserId: string;
        role: Role;
        sessionId: string;
        externalIdentityReference?: string;
      };
      requestId: string;
    }
  }
}

export {};
