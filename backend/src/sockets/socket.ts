import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { authenticateSocket, type SocketUser } from './authentication';
import { registerMessagingHandlers } from './messaging';
import { SOCKET_NAMESPACE } from './events';
import logger from '../config/logger';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: '*', credentials: true },
    maxHttpBufferSize: 2 * 1024 * 1024, // 2MB envelope cap; content is opaque
  });

  io.of(SOCKET_NAMESPACE).use(async (socket, next) => {
    const user = await authenticateSocket(socket);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    return next();
  });

  io.of(SOCKET_NAMESPACE).on('connection', (socket) => {
    const user = socket.data.user as SocketUser;
    logger.info({ userId: user.internalUserId }, 'socket connected');
    socket.emit('authenticated', { userId: user.internalUserId });
    registerMessagingHandlers(io!, socket, user);
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function getSocketServer(): Server | null {
  return io;
}
