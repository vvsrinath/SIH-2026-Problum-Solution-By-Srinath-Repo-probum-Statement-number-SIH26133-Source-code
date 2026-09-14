import { verifyAccessToken } from '../config/security';
import { sessionService } from '../services/session.service';
import { socketAuthError } from './helpers';
import type { Socket } from 'socket.io';
import type { Role } from '../constants/roles';

export interface SocketUser {
  internalUserId: string;
  role: Role;
  sessionId: string;
}

/** Resolve and validate a socket connection's access token. */
export async function authenticateSocket(socket: Socket): Promise<SocketUser | null> {
  try {
    const token =
      (socket.handshake.auth as { token?: string } | undefined)?.token ||
      ((socket.handshake.headers as Record<string, unknown>).authorization as string | undefined)?.replace(
        /^Bearer\s+/i,
        '',
      );

    if (!token) throw new Error('missing-token');

    const payload = verifyAccessToken(token);
    if (!payload) throw new Error('invalid-token');

    const session = await sessionService.validate(payload.sessionId);
    if (!session) throw new Error('invalid-session');

    return { internalUserId: session.internalUserId, role: session.role, sessionId: session.sessionId };
  } catch (err) {
    socket.emit(socketAuthError(), { error: 'UNAUTHORIZED', message: 'Socket authentication failed' });
    socket.disconnect(true);
    return null;
  }
}
