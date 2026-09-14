import type { Server, Socket } from 'socket.io';
import { Appointment } from '../database/models/Appointment';
import { Referral } from '../database/models/Referral';
import { SOCKET_EVENTS } from './events';
import { socketErrorEvent } from './helpers';
import type { SocketUser } from './authentication';
import logger from '../config/logger';

/**
 * In-memory view of which authenticated users are present in which
 * conversation. E2EE message content is NEVER persisted or inspected; this
 * map holds only routing identity, and lives entirely in memory (ephemeral,
 * lost on restart — reconnection re-registers participants on the device).
 */
const conversationMembers = new Map<string, Set<string>>(); // conversationId -> set of internalUserId
const userRooms = new Map<string, Set<string>>(); // internalUserId -> set of conversationIds

/** Verify a user belongs to a conversation via a real appointment/referral. */
async function isConversationParticipant(internalUserId: string, role: string, conversationId: string): Promise<boolean> {
  // A conversation references an appointment or referral by id.
  const [appt, ref] = await Promise.all([
    Appointment.findOne({ appointmentId: conversationId }).lean(),
    Referral.findOne({ referralId: conversationId }).lean(),
  ]);
  if (appt) {
    if (role === 'PATIENT') return appt.patientId === internalUserId;
    if (role === 'DOCTOR') return appt.doctorId === internalUserId;
  }
  if (ref) {
    if (role === 'PATIENT') return ref.patientId === internalUserId;
    if (role === 'DOCTOR' || role === 'HEALTH_WORKER') {
      return ref.fromDoctorId === internalUserId || ref.toDoctorId === internalUserId;
    }
  }
  return false;
}

function removeFromConversation(userId: string, conversationId: string) {
  conversationMembers.get(conversationId)?.delete(userId);
  userRooms.get(userId)?.delete(conversationId);
  if (conversationMembers.get(conversationId)?.size === 0) conversationMembers.delete(conversationId);
}

export function registerMessagingHandlers(io: Server, socket: Socket, user: SocketUser) {
  const { internalUserId, role } = user;
  if (!userRooms.has(internalUserId)) userRooms.set(internalUserId, new Set());

  const joinConversation = async (conversationId: string, cb?: (resp: unknown) => void) => {
    if (typeof conversationId !== 'string' || !conversationId.trim()) {
      cb?.({ success: false, error: 'BAD_CONVERSATION_ID' });
      return;
    }
    const allowed = await isConversationParticipant(internalUserId, role, conversationId);
    if (!allowed) {
      socket.emit(socketErrorEvent(SOCKET_EVENTS.CONVERSATION_JOIN), {
        error: 'FORBIDDEN',
        message: 'You are not a participant of this conversation',
      });
      cb?.({ success: false, error: 'FORBIDDEN' });
      return;
    }
    await socket.join(conversationId);
    if (!conversationMembers.has(conversationId)) conversationMembers.set(conversationId, new Set());
    conversationMembers.get(conversationId)!.add(internalUserId);
    userRooms.get(internalUserId)!.add(conversationId);
    socket.to(conversationId).emit(SOCKET_EVENTS.CONVERSATION_JOIN, { userId: internalUserId, conversationId });
    cb?.({ success: true, conversationId });
  };

  const leaveConversation = (conversationId: string, cb?: (resp: unknown) => void) => {
    void socket.leave(conversationId);
    removeFromConversation(internalUserId, conversationId);
    socket.to(conversationId).emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { userId: internalUserId, conversationId });
    cb?.({ success: true });
  };

  const sendMessage = (payload: unknown, cb?: (resp: unknown) => void) => {
    const msg = payload as {
      conversationId?: string;
      messageId?: string;
      ciphertext?: string;
      nonce?: string;
      timestamp?: string;
      protocolVersion?: string;
    };
    if (!msg || typeof msg.conversationId !== 'string' || !msg.conversationId.trim()) {
      cb?.({ success: false, error: 'BAD_CONVERSATION_ID' });
      return;
    }
    // We do not validate ciphertext content — it is opaque to the server.
    if (typeof msg.messageId !== 'string' || typeof msg.ciphertext !== 'string' || !msg.ciphertext) {
      cb?.({ success: false, error: 'INVALID_PAYLOAD' });
      return;
    }
    const envelope = {
      conversationId: msg.conversationId,
      messageId: msg.messageId,
      senderId: internalUserId,
      ciphertext: msg.ciphertext,
      nonce: msg.nonce ?? '',
      timestamp: msg.timestamp ?? new Date().toISOString(),
      protocolVersion: msg.protocolVersion ?? '1.0',
    };
    const participants = conversationMembers.get(msg.conversationId);
    if (!participants || participants.size === 0) {
      cb?.({ success: false, error: 'NO_RECIPIENTS_ONLINE' });
      return;
    }
    // send to all OTHER members only (never echo back to the sender)
    socket.to(msg.conversationId).emit(SOCKET_EVENTS.MESSAGE_DELIVER, envelope);
    cb?.({ success: true, messageId: msg.messageId });
    logger.info({ conversationId: msg.conversationId, senderId: internalUserId }, 'message relayed');
  };

  const ack = (payload: { conversationId?: string; messageId?: string }) => {
    socket.to(payload?.conversationId ?? '').emit(SOCKET_EVENTS.MESSAGE_ACK, {
      userId: internalUserId,
      messageId: payload?.messageId,
    });
  };

  const markRead = (payload: { conversationId?: string; messageId?: string }) => {
    socket.to(payload?.conversationId ?? '').emit(SOCKET_EVENTS.MESSAGE_READ, {
      userId: internalUserId,
      messageId: payload?.messageId,
    });
  };

  const typing = (event: string) => (payload: { conversationId?: string }) => {
    socket.to(payload?.conversationId ?? '').emit(event, { userId: internalUserId, conversationId: payload?.conversationId });
  };

  socket.on(SOCKET_EVENTS.CONVERSATION_JOIN, joinConversation);
  socket.on(SOCKET_EVENTS.CONVERSATION_LEAVE, leaveConversation);
  socket.on(SOCKET_EVENTS.MESSAGE_SEND, sendMessage);
  socket.on(SOCKET_EVENTS.MESSAGE_ACK, ack);
  socket.on(SOCKET_EVENTS.MESSAGE_READ, markRead);
  socket.on(SOCKET_EVENTS.TYPING_START, typing(SOCKET_EVENTS.TYPING_START));
  socket.on(SOCKET_EVENTS.TYPING_STOP, typing(SOCKET_EVENTS.TYPING_STOP));

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    const convs = userRooms.get(internalUserId);
    if (convs) for (const c of Array.from(convs)) removeFromConversation(internalUserId, c);
    userRooms.delete(internalUserId);
  });
}
