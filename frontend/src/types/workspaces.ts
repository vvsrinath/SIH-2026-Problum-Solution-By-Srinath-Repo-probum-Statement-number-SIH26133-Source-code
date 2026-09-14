import type { FollowUpStatus, TriageRisk } from './index';

/* ------------------------------ messaging ------------------------------ */

export interface ConversationSummary {
  id: string;
  peerName: string;
  peerRole: 'DOCTOR' | 'PATIENT' | 'HEALTH_WORKER' | 'ADMIN' | 'PHC';
  lastMessage: string;
  lastAt: string;
  unread: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'me' | 'peer';
  text: string;
  at: string;
}

/* ---------------------------- prescriptions ---------------------------- */

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  issuedAt: string;
  diagnosis?: string;
  items: PrescriptionItem[];
  followUp?: string;
}

/* ------------------------------- reports ------------------------------- */

export type ReportCategory = 'LAB' | 'IMAGING' | 'PATHOLOGY' | 'SCREENING';
export type ReportStatus = 'PENDING' | 'READY' | 'REVIEWED';

export interface Report {
  id: string;
  patientId: string;
  patientName: string;
  category: ReportCategory;
  title: string;
  facility: string;
  orderedAt: string;
  status: ReportStatus;
  summary?: string;
}

/* ----------------------------- health worker ---------------------------- */

export interface WorkerStats {
  households: number;
  patients: number;
  visitsToday: number;
  pendingFollowUps: number;
  referralsThisWeek: number;
  highRiskPatients: number;
}

export interface FieldPatient {
  patientId: string;
  name: string;
  village: string;
  age: number;
  sex: 'MALE' | 'FEMALE';
  condition: string;
  risk: TriageRisk;
  lastVisitAt: string;
  nextVisitAt: string;
}

export interface TriageNote {
  id: string;
  patientName: string;
  capturedAt: string;
  symptoms: string;
  risk: TriageRisk;
  outcome: string;
}

export interface WorkerReferral {
  id: string;
  patientName: string;
  toFacility: string;
  reason: string;
  status: 'CREATED' | 'ACCEPTED' | 'COMPLETED';
  createdAt: string;
}

export interface WorkerFollowUp {
  id: string;
  patientName: string;
  scheduledAt: string;
  kind: string;
  status: FollowUpStatus;
}

/* --------------------------------- PHC --------------------------------- */

export interface PhcStats {
  queueCount: number;
  patientsToday: number;
  bedsOccupied: number;
  bedsTotal: number;
  medicinesLow: number;
  pendingReferrals: number;
}

export interface QueueEntry {
  token: string;
  patientName: string;
  reason: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
  waitingMin: number;
  status: 'WAITING' | 'IN_CONSULTATION' | 'DONE';
}

export interface PhcPatient {
  patientId: string;
  name: string;
  age: number;
  sex: 'MALE' | 'FEMALE';
  reason: string;
  lastVisitAt: string;
}

export interface PhcReferral {
  id: string;
  patientName: string;
  direction: 'INCOMING' | 'OUTGOING';
  counterpart: string;
  reason: string;
  status: 'CREATED' | 'ACCEPTED' | 'COMPLETED';
  createdAt: string;
}

export interface Medicine {
  name: string;
  batch: string;
  stock: number;
  lowWatermark: number;
  expiry: string;
}

export interface DiagnosticItem {
  id: string;
  patientName: string;
  test: string;
  status: 'PENDING' | 'READY' | 'REVIEWED';
  orderedAt: string;
}

/* -------------------------------- admin -------------------------------- */

export interface AdminStats {
  villages: number;
  facilities: number;
  activeUsers: number;
  referralsThisMonth: number;
  avgResponseHours: number;
  satisfactionPct: number;
}

export interface AnalyticsRow {
  metric: string;
  value: number;
  unit: string;
  changePct: number;
}

export interface AdminFacility {
  id: string;
  name: string;
  type: string;
  district: string;
  doctors: number;
  staff: number;
  utilizationPct: number;
  status: 'ACTIVE' | 'ATTENTION' | 'CLOSED';
}

export interface AdminReferralCase {
  id: string;
  patient: string;
  from: string;
  to: string;
  ageDays: number;
  status: 'CREATED' | 'ACCEPTED' | 'COMPLETED';
  escalated: boolean;
}

export interface AdminReportItem {
  id: string;
  title: string;
  period: string;
  kind: string;
  generatedAt: string;
  sizeKb: number;
}

export interface AdminSetting {
  key: string;
  label: string;
  value: string;
  kind: 'TEXT' | 'BOOL' | 'NUMBER';
}

/* ------------------------------- consult ------------------------------- */

export interface TeleconsultSession {
  id: string;
  appointmentId: string;
  doctorName: string;
  scheduledAt: string;
  mode: 'VIDEO' | 'AUDIO';
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  roomHint: string;
}