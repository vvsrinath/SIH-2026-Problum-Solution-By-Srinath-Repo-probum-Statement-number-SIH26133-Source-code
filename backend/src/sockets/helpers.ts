import { SOCKET_EVENTS } from './events';

export function socketErrorEvent(eventName: string): string {
  return `${eventName}:error`;
}

export function socketAuthError(): string {
  return SOCKET_EVENTS.ERROR;
}
