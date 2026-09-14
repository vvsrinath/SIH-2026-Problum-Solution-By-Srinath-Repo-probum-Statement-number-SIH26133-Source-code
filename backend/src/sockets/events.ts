export const SOCKET_EVENTS = {
  CONNECT: 'connection',
  AUTHENTICATE: 'authenticate',
  CONVERSATION_JOIN: 'conversation:join',
  MESSAGE_SEND: 'message:send',
  MESSAGE_DELIVER: 'message:deliver',
  MESSAGE_ACK: 'message:ack',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  CONVERSATION_LEAVE: 'conversation:leave',
  DISCONNECT: 'disconnect',
  ERROR: 'socket:error',
} as const;

export const SOCKET_NAMESPACE = '/messaging';
