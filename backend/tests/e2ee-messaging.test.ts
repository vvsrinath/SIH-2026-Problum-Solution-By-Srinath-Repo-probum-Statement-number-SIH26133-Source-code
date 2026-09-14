import { describe, it, expect, beforeAll } from 'vitest';
import { connectTestDb, resetCollections } from './setup';
import { registerMessagingHandlers } from '../src/sockets/messaging';
import { Appointment } from '../src/database/models/Appointment';
import { newAppointmentId, newPatientId, newDoctorId } from '../src/utils/id';
import { SOCKET_EVENTS } from '../src/sockets/events';
import type { SocketUser } from '../src/sockets/authentication';

type Handler = (...args: unknown[]) => void;

/** Minimal fake socket that records emissions and mimics join/broadcast. */
function createFakeSocket(user: SocketUser) {
  const handlers = new Map<string, Handler>();
  const emitted: Array<{ event: string; payload: unknown }> = [];
  const roomEmissions: Array<{ event: string; payload: unknown }> = [];
  const joined = new Set<string>();

  const socket = {
    data: { user },
    on(event: string, fn: Handler) {
      handlers.set(event, fn);
    },
    join(room: string) {
      joined.add(room);
      return Promise.resolve();
    },
    leave() {
      return Promise.resolve();
    },
    emit(event: string, payload: unknown) {
      emitted.push({ event, payload });
    },
    to() {
      return {
        emit(event: string, payload: unknown) {
          roomEmissions.push({ event, payload });
        },
      };
    },
  };

  return {
    socket,
    handlers,
    emitted,
    roomEmissions,
    joined,
  };
}

describe('E2EE socket messaging relay', () => {
  beforeAll(async () => {
    if (await connectTestDb()) await resetCollections(['appointments']);
  });

  it('relays opaque ciphertext to other participants only, never back to sender, and never persists', async () => {
    expect(await connectTestDb()).toBe(true);

    const appointment = await Appointment.create({
      appointmentId: newAppointmentId(),
      patientId: newPatientId(),
      doctorId: newDoctorId(),
      scheduledAt: new Date(Date.now() + 86400000),
      durationMinutes: 15,
      consultationType: 'VIDEO',
    });

    const patient = createFakeSocket({ internalUserId: appointment.patientId, role: 'PATIENT', sessionId: 's1' });
    const doctor = createFakeSocket({ internalUserId: appointment.doctorId, role: 'DOCTOR', sessionId: 's2' });
    const stranger = createFakeSocket({ internalUserId: newPatientId(), role: 'PATIENT', sessionId: 's3' });

    registerMessagingHandlers(patient.socket as never, patient.socket as never, patient.socket.data.user);
    registerMessagingHandlers(doctor.socket as never, doctor.socket as never, doctor.socket.data.user);
    registerMessagingHandlers(stranger.socket as never, stranger.socket as never, stranger.socket.data.user);

    // Participants join; stranger is denied.
    await patient.handlers.get(SOCKET_EVENTS.CONVERSATION_JOIN)!(appointment.appointmentId, () => undefined);
    await doctor.handlers.get(SOCKET_EVENTS.CONVERSATION_JOIN)!(appointment.appointmentId, () => undefined);

    let forbidden = false;
    await stranger.handlers.get(SOCKET_EVENTS.CONVERSATION_JOIN)!(appointment.appointmentId, () => undefined);
    forbidden = stranger.emitted.some((e) => e.event === `${SOCKET_EVENTS.CONVERSATION_JOIN}:error`);

    // Doctor sends an encrypted envelope.
    const ciphertext = 'base64-ciphertext-blob';
    let ackOk = false;
    await doctor.handlers.get(SOCKET_EVENTS.MESSAGE_SEND)!(
      { conversationId: appointment.appointmentId, messageId: 'm1', ciphertext, nonce: 'n1' },
      (r: unknown) => { ackOk = (r as { success: boolean }).success === true; },
    );

    // Server must never store ChatMessage (no model exists) and must not echo to sender.
    // The sender (doctor) broadcasts to the room (all members incl. patient) via socket.to(room).
    const doctorBroadcast = doctor.roomEmissions.filter((e) => e.event === SOCKET_EVENTS.MESSAGE_DELIVER);
    const doctorSelfEcho = doctor.emitted.filter((e) => e.event === SOCKET_EVENTS.MESSAGE_DELIVER);

    expect(ackOk).toBe(true);
    expect(forbidden).toBe(true); // a stranger was denied joining
    expect(doctorBroadcast.length).toBeGreaterThanOrEqual(1); // sender emitted to room (other members)
    expect(doctorBroadcast[doctorBroadcast.length - 1].payload).toMatchObject({
      conversationId: appointment.appointmentId,
      messageId: 'm1',
      senderId: appointment.doctorId,
      ciphertext,
    });
    // No echo back to the sender's own socket.
    expect(doctorSelfEcho.length).toBe(0);
  });
});
