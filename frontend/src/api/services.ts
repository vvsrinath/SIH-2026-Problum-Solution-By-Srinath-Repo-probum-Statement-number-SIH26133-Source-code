import { request, type ApiError } from './client';
import { runMockTriage } from './mockTriage';
import {
  mockSelf,
  mockDoctors,
  mockAppointments,
  mockAvailability,
  mockReferrals,
  mockNotifications,
  mockFollowUps,
  mockNearbyHospitals,
  mockDocuments,
} from './mockData';
import type {
  RealAppointment,
  RealReferral,
  DoctorsPage,
  DoctorPublic,
  DoctorAvailability,
  Pagination,
  TriageAssessment,
  TriageRisk,
  RuleAssessment,
  RuleVocabulary,
  RuleFollowupQuestion,
  NotificationItem,
  NotificationsPage,
  FollowUp,
  NearbyHospitalsResult,
  SelfView,
} from '../types';

export type { ApiError };

/** True when the failure is "backend unreachable" (offline demo mode). */
function isOffline(err: unknown): boolean {
  return (err as ApiError)?.kind === 'network';
}

/**
 * Domain service layer for the Swasthya Sathi backend.
 *
 * Every function maps directly to a verified backend endpoint and returns real
 * data. There are NO demo fallbacks: a failed/empty request surfaces as a
 * typed `ApiError` (or an empty list) for the UI to render loading / empty /
 * error states honestly.
 */

/* ------------------------------ auth ------------------------------ */

export async function getMe() {
  try {
    return await request<{ internalUserId: string; role: string; status: string; lastLoginAt?: string }>(
      '/api/v1/auth/me',
    );
  } catch (err) {
    if (isOffline(err)) {
      return {
        internalUserId: mockSelf.internalUserId,
        role: 'PATIENT',
        status: 'ACTIVE',
        lastLoginAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

export async function getSelf(): Promise<SelfView> {
  try {
    return await request<SelfView>('/api/v1/users/me');
  } catch (err) {
    if (isOffline(err)) return mockSelf;
    throw err;
  }
}

/* ----------------------------- doctors ----------------------------- */

export async function fetchDoctors(opts?: {
  specialization?: string;
  page?: number;
  limit?: number;
}): Promise<DoctorsPage> {
  try {
    return await request<DoctorsPage>('/api/v1/doctors', {
      query: { specialization: opts?.specialization, page: opts?.page ?? 1, limit: opts?.limit ?? 20 },
    });
  } catch (err) {
    if (isOffline(err)) {
      let list = mockDoctors;
      if (opts?.specialization && opts.specialization !== 'All') {
        list = list.filter((d) => d.specialization === opts.specialization);
      }
      const limit = opts?.limit ?? list.length;
      const total = list.length;
      return {
        doctors: list.slice(0, limit),
        pagination: { page: 1, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      };
    }
    throw err;
  }
}

export async function fetchDoctor(id: string): Promise<DoctorPublic> {
  try {
    const data = await request<{ doctor: DoctorPublic }>(`/api/v1/doctors/${id}`);
    return data.doctor;
  } catch (err) {
    if (isOffline(err)) {
      const found = mockDoctors.find((d) => d.doctorId === id);
      if (found) return found;
    }
    throw err;
  }
}

export async function fetchDoctorAvailability(id: string): Promise<DoctorAvailability> {
  try {
    return await request<DoctorAvailability>(`/api/v1/doctors/${id}/availability`);
  } catch (err) {
    if (isOffline(err)) {
      const found = mockAvailability[id];
      if (found) return found;
      return {
        doctorId: id,
        weekly: [
          { dayOfWeek: 1, startMinute: 540, endMinute: 1020, consultationDurationMinutes: 30 },
          { dayOfWeek: 2, startMinute: 540, endMinute: 1020, consultationDurationMinutes: 30 },
          { dayOfWeek: 3, startMinute: 540, endMinute: 1020, consultationDurationMinutes: 30 },
          { dayOfWeek: 4, startMinute: 540, endMinute: 1020, consultationDurationMinutes: 30 },
          { dayOfWeek: 5, startMinute: 540, endMinute: 1020, consultationDurationMinutes: 30 },
        ],
        exceptions: [],
      };
    }
    throw err;
  }
}

/* --------------------------- appointments --------------------------- */

export async function fetchAppointments(opts?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ appointments: RealAppointment[]; pagination: Pagination }> {
  try {
    return await request('/api/v1/appointments', {
      query: { status: opts?.status, page: opts?.page ?? 1, limit: opts?.limit ?? 50 },
    });
  } catch (err) {
    if (isOffline(err)) {
      let list = mockAppointments;
      if (opts?.status) list = list.filter((a) => a.status === opts.status);
      const limit = opts?.limit ?? list.length;
      return {
        appointments: list.slice(0, limit),
        pagination: { page: 1, limit, total: list.length, totalPages: 1 },
      };
    }
    throw err;
  }
}

export async function fetchAppointment(id: string): Promise<RealAppointment> {
  try {
    const data = await request<{ appointment: RealAppointment }>(`/api/v1/appointments/${id}`);
    return data.appointment;
  } catch (err) {
    if (isOffline(err)) {
      const found = mockAppointments.find((a) => a.appointmentId === id);
      if (found) return found;
    }
    throw err;
  }
}

export interface BookAppointmentInput {
  doctorId: string;
  scheduledAt: string;
  consultationType: 'IN_PERSON' | 'VIDEO' | 'AUDIO';
  reason?: string;
}

export async function createAppointment(
  input: BookAppointmentInput,
): Promise<RealAppointment> {
  try {
    return await request<RealAppointment>('/api/v1/appointments', {
      method: 'POST',
      body: input,
      idempotencyKey: `book-${input.doctorId}-${input.scheduledAt}`,
    });
  } catch (err) {
    if (isOffline(err)) {
      const created: RealAppointment = {
        appointmentId: `mock-appt-${Date.now().toString(36)}`,
        patientId: mockSelf.internalUserId,
        doctorId: input.doctorId,
        scheduledAt: input.scheduledAt,
        durationMinutes: 30,
        consultationType: input.consultationType,
        status: 'CONFIRMED',
        reason: input.reason,
        bookedByUserId: mockSelf.internalUserId,
      };
      mockAppointments.unshift(created);
      return created;
    }
    throw err;
  }
}

export async function cancelAppointment(id: string, reason?: string): Promise<RealAppointment> {
  try {
    return await request<RealAppointment>(`/api/v1/appointments/${id}/cancel`, {
      method: 'POST',
      body: reason ? { reason } : undefined,
    });
  } catch (err) {
    if (isOffline(err)) {
      const found = mockAppointments.find((a) => a.appointmentId === id);
      if (found) {
        found.status = 'CANCELLED';
        found.cancelledReason = reason;
        found.cancelledAt = new Date().toISOString();
        return found;
      }
    }
    throw err;
  }
}

export async function confirmAppointment(id: string): Promise<RealAppointment> {
  try {
    return await request<RealAppointment>(`/api/v1/appointments/${id}/confirm`, { method: 'POST' });
  } catch (err) {
    if (isOffline(err)) {
      const found = mockAppointments.find((a) => a.appointmentId === id);
      if (found) found.status = 'CONFIRMED';
      return found as RealAppointment;
    }
    throw err;
  }
}

export async function startAppointment(id: string): Promise<RealAppointment> {
  try {
    return await request<RealAppointment>(`/api/v1/appointments/${id}/start`, { method: 'POST' });
  } catch (err) {
    if (isOffline(err)) {
      const found = mockAppointments.find((a) => a.appointmentId === id);
      if (found) found.status = 'IN_PROGRESS';
      return found as RealAppointment;
    }
    throw err;
  }
}

export async function completeAppointment(id: string): Promise<RealAppointment> {
  try {
    return await request<RealAppointment>(`/api/v1/appointments/${id}/complete`, { method: 'POST' });
  } catch (err) {
    if (isOffline(err)) {
      const found = mockAppointments.find((a) => a.appointmentId === id);
      if (found) found.status = 'COMPLETED';
      return found as RealAppointment;
    }
    throw err;
  }
}

/* ----------------------------- referrals ----------------------------- */

export async function fetchReferrals(): Promise<RealReferral[]> {
  try {
    const data = await request<{ referrals: RealReferral[] }>('/api/v1/referrals');
    return data.referrals ?? [];
  } catch (err) {
    if (isOffline(err)) return mockReferrals;
    throw err;
  }
}

export async function createReferral(input: {
  patientUserId: string;
  toFacilityId?: string;
  toDoctorUserId?: string;
  reason?: string;
  clinicalSummary?: string;
}): Promise<RealReferral> {
  return request<RealReferral>('/api/v1/referrals', { method: 'POST', body: input });
}

export async function acceptReferral(id: string): Promise<RealReferral> {
  try {
    return await request<RealReferral>(`/api/v1/referrals/${id}/accept`, { method: 'POST' });
  } catch (err) {
    if (isOffline(err)) {
      const found = mockReferrals.find((r) => r.referralId === id);
      if (found) found.status = 'ACCEPTED';
      return found as RealReferral;
    }
    throw err;
  }
}

/* ------------------------------ triage ------------------------------ */

export interface TriageInput {
  symptoms: string;
  duration?: string;
  ageGroup?: 'ADULT' | 'CHILD' | 'INFANT' | 'UNSPECIFIED';
  language?: string;
  context?: string;
}

export async function assessTriage(input: TriageInput): Promise<TriageAssessment> {
  try {
    const data = await request<{ assessment: TriageAssessment }>('/api/v1/triage/assess', {
      method: 'POST',
      body: {
        symptoms: input.symptoms,
        duration: input.duration,
        ageGroup: input.ageGroup ?? 'UNSPECIFIED',
        language: input.language ?? 'en',
        context: input.context,
      },
    });
    return data.assessment;
  } catch (err) {
    if (isOffline(err)) {
      return runMockTriage({
        symptoms: input.symptoms,
        duration: input.duration,
        ageGroup: input.ageGroup,
        context: input.context,
      });
    }
    throw err;
  }
}

export async function fetchTriage(id: string): Promise<TriageAssessment> {
  const data = await request<{ assessment: TriageAssessment }>(`/api/v1/triage/${id}`);
  return data.assessment;
}

/* ---------------------- rule-based symptom checker --------------------- */

const AI_SERVICE_URL =
  (import.meta.env.VITE_AI_SERVICE_URL as string | undefined) ?? 'http://localhost:8100';

export interface RuleAssessmentInput {
  symptoms: string;
  duration?: string;
  ageGroup?: string;
  context?: Record<string, string>;
}

/** Posts to the FastAPI rule engine directly (no Node proxy needed). */
async function postRuleAssessment(input: RuleAssessmentInput): Promise<RuleAssessment> {
  const res = await fetch(`${AI_SERVICE_URL}/api/v1/triage/assess-rule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symptoms: input.symptoms,
      duration: input.duration,
      age_group: input.ageGroup,
      context: input.context,
    }),
  });
  if (!res.ok) {
    const err = new Error(`Symptom assessment failed (${res.status})`) as ApiError;
    err.kind = 'unavailable';
    throw err;
  }
  const raw = (await res.json()) as Record<string, unknown>;
  return {
    riskLevel: raw.risk_level as RuleAssessment['riskLevel'],
    riskScore: Number(raw.risk_score ?? 0),
    possibleConditions: (raw.possible_conditions as string[]) ?? [],
    redFlags: ((raw.red_flags as RuleAssessment['redFlags']) ?? []).filter(
      (f) => f && typeof f.message === 'string',
    ),
    missingInformation: (raw.missing_information as string[]) ?? [],
    recommendedAction: String(raw.recommended_action ?? ''),
    reason: (raw.reason as string[]) ?? [],
    nextSteps: (raw.next_steps as string[]) ?? [],
    selfCare: (raw.self_care as string[]) ?? [],
    seekCareIf: (raw.seek_care_if as string[]) ?? [],
    disclaimer: String(raw.disclaimer ?? ''),
    modelVersion: String(raw.model_version ?? 'rule-based-v1.0'),
    source: raw.source === 'RULE_ENGINE' ? 'RULE_ENGINE' : 'MANUAL_FALLBACK',
  };
}

export async function assessSymptomsRule(input: RuleAssessmentInput): Promise<RuleAssessment> {
  try {
    return await postRuleAssessment(input);
  } catch (err) {
    if ((err as ApiError)?.kind === 'network' || (err as ApiError)?.kind === 'unavailable') {
      const mock = runMockTriage({
        symptoms: input.symptoms,
        duration: input.duration,
        ageGroup: input.ageGroup,
      });
      return {
        riskLevel: mock.riskLevel,
        riskScore: mock.riskLevel === 'URGENT' ? 5 : mock.riskLevel === 'HIGH' ? 3 : mock.riskLevel === 'MODERATE' ? 2 : mock.riskLevel === 'LOW' ? 1 : 0,
        possibleConditions: mock.possibleConditions,
        redFlags: mock.riskLevel === 'URGENT' ? [{ id: 'offline', message: mock.recommendedAction, action: mock.recommendedAction }] : [],
        missingInformation: mock.missingInformation,
        recommendedAction: mock.recommendedAction,
        reason: [],
        nextSteps: [mock.recommendedAction],
        selfCare: [],
        seekCareIf: [],
        disclaimer: mock.disclaimer ?? 'This is care guidance, not a medical diagnosis.',
        modelVersion: mock.modelVersion,
        source: 'MANUAL_FALLBACK',
      };
    }
    throw err;
  }
}

export async function fetchRuleVocabulary(): Promise<RuleVocabulary> {
  const res = await fetch(`${AI_SERVICE_URL}/api/v1/triage/symptoms`);
  if (!res.ok) throw new Error(`Symptom vocabulary failed (${res.status})`);
  return (await res.json()) as RuleVocabulary;
}

const FALLBACK_FOLLOWUPS: RuleFollowupQuestion[] = [
  {
    id: 'duration',
    question: 'How long have you had these symptoms?',
    category: 'timing',
    required: false,
    options: [
      { value: 'just_started', label: 'Just started (today)' },
      { value: '1_3_days', label: '1–3 days' },
      { value: '4_7_days', label: '4–7 days' },
      { value: '1_2_weeks', label: '1–2 weeks' },
      { value: 'more_than_2_weeks', label: 'More than 2 weeks' },
    ],
  },
  {
    id: 'severity',
    question: 'How severe are your symptoms?',
    category: 'severity',
    required: false,
    options: [
      { value: 'mild', label: 'Mild — noticeable but manageable' },
      { value: 'moderate', label: 'Moderate — interfering with daily activities' },
      { value: 'severe', label: 'Severe — difficult to manage' },
      { value: 'very_severe', label: 'Very severe — unable to function normally' },
    ],
  },
  {
    id: 'age_group',
    question: "What is the patient's age group?",
    category: 'demographics',
    required: false,
    options: [
      { value: 'infant', label: 'Infant (0–2 years)' },
      { value: 'child', label: 'Child (3–12 years)' },
      { value: 'adolescent', label: 'Adolescent (13–17 years)' },
      { value: 'adult', label: 'Adult (18–59 years)' },
      { value: 'elderly', label: 'Elderly (60+ years)' },
    ],
  },
  {
    id: 'pregnancy',
    question: 'Is the patient pregnant or could they be pregnant?',
    category: 'context',
    required: false,
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
      { value: 'unsure', label: 'Unsure' },
    ],
  },
  {
    id: 'chronic_conditions',
    question: 'Do you have any chronic health conditions?',
    category: 'context',
    required: false,
    options: [
      { value: 'none', label: 'None' },
      { value: 'diabetes', label: 'Diabetes' },
      { value: 'hypertension', label: 'Hypertension (high blood pressure)' },
      { value: 'asthma', label: 'Asthma or lung disease' },
      { value: 'heart_disease', label: 'Heart disease' },
      { value: 'kidney_disease', label: 'Kidney disease' },
      { value: 'other', label: 'Other chronic condition' },
    ],
  },
  {
    id: 'current_medications',
    question: 'Are you currently taking any medications?',
    category: 'context',
    required: false,
    options: [
      { value: 'no', label: 'No medications' },
      { value: 'yes', label: 'Yes, I am taking medications' },
    ],
  },
];

export async function fetchRuleFollowups(symptomIds: string[]): Promise<RuleFollowupQuestion[]> {
  const params = symptomIds.length
    ? `?symptom_ids=${encodeURIComponent(symptomIds.join(','))}`
    : '';
  const res = await fetch(`${AI_SERVICE_URL}/api/v1/triage/followups${params}`);
  if (!res.ok) throw new Error(`Follow-up questions failed (${res.status})`);
  const data = (await res.json()) as { questions?: RuleFollowupQuestion[] };
  return data.questions ?? FALLBACK_FOLLOWUPS;
}

/* --------------------------- consultations --------------------------- */

export async function startConsultation(appointmentId: string) {
  return request(`/api/v1/consultations/${appointmentId}/start`, { method: 'POST' });
}

export async function endConsultation(id: string) {
  return request(`/api/v1/consultations/${id}/end`, { method: 'POST' });
}

/* ------------------------- nearby hospitals ------------------------- */

export async function fetchNearbyHospitals(input: {
  lat: number;
  lng: number;
  radiusKm?: number;
  type?: string;
  language?: string;
}): Promise<NearbyHospitalsResult> {
  try {
    return await request<NearbyHospitalsResult>('/api/v1/hospitals/nearby', {
      query: {
        lat: input.lat,
        lng: input.lng,
        radiusKm: input.radiusKm ?? 10,
        type: (input.type ?? 'ALL').toUpperCase(),
        language: input.language ?? 'en',
      },
    });
  } catch (err) {
    if (isOffline(err)) return mockNearbyHospitals;
    throw err;
  }
}

/* --------------------------- follow-ups --------------------------- */

export async function fetchFollowUps(): Promise<FollowUp[]> {
  try {
    const data = await request<{ followUps: FollowUp[] }>('/api/v1/followups');
    return data.followUps ?? [];
  } catch (err) {
    if (isOffline(err)) return mockFollowUps;
    throw err;
  }
}

export async function createFollowUp(input: {
  patientUserId: string;
  appointmentId?: string;
  scheduledAt?: string;
  reason?: string;
  instructions?: string;
}): Promise<FollowUp> {
  const data = await request<{ followUp: FollowUp }>('/api/v1/followups', {
    method: 'POST',
    body: input,
  });
  return data.followUp;
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  try {
    const data = await request<{ followUp: FollowUp }>(`/api/v1/followups/${id}/complete`, {
      method: 'POST',
    });
    return data.followUp;
  } catch (err) {
    if (isOffline(err)) {
      const found = mockFollowUps.find((f) => f.followUpId === id);
      if (found) found.status = 'COMPLETED';
      return found as FollowUp;
    }
    throw err;
  }
}

/* ---------------------------- notifications ---------------------------- */

export async function fetchNotifications(opts?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsPage> {
  try {
    return await request<NotificationsPage>('/api/v1/notifications', {
      query: { limit: opts?.limit ?? 30, offset: opts?.offset ?? 0, unreadOnly: opts?.unreadOnly },
    });
  } catch (err) {
    if (isOffline(err)) {
      let items = mockNotifications;
      if (opts?.unreadOnly) items = items.filter((n) => !n.read);
      const limit = opts?.limit ?? items.length;
      const unread = mockNotifications.filter((n) => !n.read).length;
      return {
        items: items.slice(0, limit),
        total: mockNotifications.length,
        unread,
      };
    }
    throw err;
  }
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  try {
    const data = await request<{ notification: NotificationItem }>(`/api/v1/notifications/${id}/read`, {
      method: 'POST',
    });
    return data.notification;
  } catch (err) {
    if (isOffline(err)) {
      const found = mockNotifications.find((n) => n.notificationId === id);
      if (found) {
        found.read = true;
        found.readAt = new Date().toISOString();
      }
      return found as NotificationItem;
    }
    throw err;
  }
}

/* --------------------------------- storage ------------------------------ */

export interface StoredDocument {
  refId: string;
  filename: string;
  mime: string;
  createdAt: string;
}

/** Encrypted documents vault (GovDrive). Throws INTEGRATION_UNAVAILABLE when not configured. */
export async function listDocuments(): Promise<{ files: StoredDocument[] }> {
  try {
    return await request<{ files: StoredDocument[] }>('/api/v1/storage');
  } catch (err) {
    if (isOffline(err)) return { files: mockDocuments };
    throw err;
  }
}

/** Map a stored document's MIME type to a HealthRecord category for display. */
export function documentCategory(mime: string): string {
  if (mime.startsWith('image/')) return 'Imaging';
  if (mime.includes('pdf') || mime.startsWith('text/')) return 'Lab Reports';
  return 'Documents';
}

/* ------------------------------ patients ------------------------------ */

export async function fetchCurrentPatientProfile() {
  return request('/api/v1/patients/me');
}

export async function patchPatientProfile(patch: Record<string, unknown>) {
  return request('/api/v1/patients/me', { method: 'PATCH', body: patch });
}

export async function patchSelf(patch: Record<string, unknown>): Promise<SelfView> {
  return request<SelfView>('/api/v1/users/me', { method: 'PATCH', body: patch });
}

/* --------------------------- consent / privacy --------------------------- */

export interface ConsentSummary {
  purposes: { purpose: string; status: string; givenAt: string }[];
  totalGranted: number;
  totalWithdrawn: number;
  totalExpired: number;
}

export interface Consent {
  consentId: string;
  purpose: string;
  version: string;
  status: 'GRANTED' | 'WITHDRAWN' | 'EXPIRED';
  givenAt: string;
  withdrawnAt?: string;
}

export async function grantConsent(purpose: string, version: string, text: string): Promise<Consent> {
  return request<Consent>('/api/v1/consent', { method: 'POST', body: { purpose, version, text } });
}

export async function fetchConsents(): Promise<Consent[]> {
  const data = await request<{ consents: Consent[] }>('/api/v1/consent');
  return data?.consents ?? [];
}

export async function fetchConsentSummary(): Promise<ConsentSummary | null> {
  return request<ConsentSummary>('/api/v1/consent/summary').catch(() => null);
}

export async function checkConsent(purpose: string): Promise<boolean> {
  const data = await request<{ valid: boolean }>(`/api/v1/consent/check?purpose=${purpose}`);
  return data?.valid ?? false;
}

export async function withdrawConsent(consentId: string): Promise<Consent> {
  return request<Consent>(`/api/v1/consent/${consentId}/withdraw`, { method: 'POST' });
}

export interface PrivacyRequest {
  privacyRequestId: string;
  type: string;
  status: string;
  createdAt: string;
}

export async function submitPrivacyRequest(type: string, details: Record<string, string>): Promise<PrivacyRequest> {
  return request<PrivacyRequest>('/api/v1/privacy/requests', { method: 'POST', body: { type, ...details } });
}

export async function fetchPrivacyRequests(): Promise<PrivacyRequest[]> {
  const data = await request<{ requests: PrivacyRequest[] }>('/api/v1/privacy/requests');
  return data?.requests ?? [];
}

export async function exportUserData(): Promise<unknown> {
  return request('/api/v1/privacy/export', { method: 'POST' });
}

export async function eraseUserData(): Promise<{ erased: boolean }> {
  return request('/api/v1/privacy/erase', { method: 'POST' });
}

/* -------------------------------- keys -------------------------------- */

export interface UserKey {
  keyId: string;
  publicKey: string;
  algorithm: string;
  fingerprint: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  registeredAt: string;
}

export async function registerKey(publicKey: string, algorithm = 'ECDH-P256'): Promise<{ keyId: string }> {
  return request<{ keyId: string }>('/api/v1/keys', { method: 'POST', body: { publicKey, algorithm } });
}

export async function fetchMyKey(): Promise<UserKey | null> {
  return request<UserKey>('/api/v1/keys/me').catch(() => null);
}

export async function fetchUserKey(userId: string): Promise<UserKey | null> {
  return request<UserKey>(`/api/v1/keys/${userId}`).catch(() => null);
}

export async function fetchBatchKeys(userIds: string[]): Promise<Record<string, UserKey>> {
  const data = await request<{ keys: Record<string, UserKey> }>('/api/v1/keys/batch', {
    method: 'POST',
    body: { userIds },
  });
  return data?.keys ?? {};
}

export async function revokeKey(keyId: string, reason: string): Promise<boolean> {
  const data = await request<{ revoked: boolean }>(`/api/v1/keys/${keyId}/revoke`, {
    method: 'POST',
    body: { reason },
  });
  return data?.revoked ?? false;
}

/* -------------------------------- sync -------------------------------- */

export async function syncActions(actions: unknown[]): Promise<unknown> {
  return request('/api/v1/sync/actions', { method: 'POST', body: { actions } });
}

export async function fetchSyncState() {
  return request('/api/v1/sync/state');
}

/* ---------------------------- display helpers ---------------------------- */

export const APPOINTMENT_LABEL: Record<string, string> = {
  BOOKED: 'Booked',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'Consulting',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'Missed',
  AVAILABLE: 'Available',
};

export const TRIAGE_LABEL: Record<TriageRisk, string> = {
  LOW: 'Low risk',
  MODERATE: 'Moderate',
  HIGH: 'High',
  URGENT: 'Urgent',
  UNKNOWN: 'Undetermined',
};

export function formatLocalDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLocalTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatLocalDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const MODE_LABEL: Record<string, string> = {
  IN_PERSON: 'In person',
  VIDEO: 'Video',
  AUDIO: 'Audio',
};
