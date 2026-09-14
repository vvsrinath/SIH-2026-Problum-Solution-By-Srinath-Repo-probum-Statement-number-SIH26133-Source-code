export type ReferralStatus = 'Pending' | 'Accepted' | 'Completed' | 'Declined';

export type AppointmentStatus =
  | 'Completed'
  | 'Consulting'
  | 'Upcoming'
  | 'Cancelled';

export type JourneyStatus = 'Completed' | 'In Progress' | 'Upcoming';

export interface Facility {
  id: string;
  name: string;
  type: string;
  distanceKm: number;
  openUntil: string;
  rating: number;
  isOpen: boolean;
  city: string;
  position: [number, number];
  services: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualifications: string;
  hospital: string;
  experienceYears: number;
  rating: number;
  reviews: number;
  photo: string;
  languages: string[];
}

export interface Patient {
  id: string;
  name: string;
  gender: string;
  age: number;
  mrn: string;
  phone: string;
  city: string;
  bloodGroup: string;
  photo: string;
  conditions: string[];
}

export interface Appointment {
  id: string;
  time: string;
  date: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  reason: string;
  facility: string;
  mode: 'In person' | 'Online';
  status: AppointmentStatus;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  patientPhoto: string;
  referredTo: string;
  specialistName: string;
  facility: string;
  date: string;
  reason: string;
  status: ReferralStatus;
  direction: 'sent' | 'received';
}

export type RecordCategory =
  | 'Lab Reports'
  | 'Prescriptions'
  | 'Immunization'
  | 'Imaging';

export interface HealthRecord {
  id: string;
  title: string;
  date: string;
  provider: string;
  category: RecordCategory;
}

export type TipCategory = 'Diseases' | 'Nutrition' | 'Fitness' | 'General';

export interface HealthTip {
  id: string;
  title: string;
  description: string;
  category: TipCategory;
  image: string;
  readTime: string;
}

export interface JourneyStep {
  id: string;
  label: string;
  status: JourneyStatus;
  detail: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  meta: string;
  date: string;
  kind: 'appointment' | 'referral' | 'record' | 'followup';
}

/* ------------------------- Real backend shapes ------------------------- */

export type RealAppointmentStatus =
  | 'BOOKED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type ConsultationType = 'IN_PERSON' | 'VIDEO' | 'AUDIO';

export interface RealAppointment {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  facilityId?: string;
  scheduledAt: string;
  durationMinutes: number;
  consultationType: ConsultationType;
  status: RealAppointmentStatus;
  consultationId?: string;
  reason?: string;
  cancelledBy?: string;
  cancelledReason?: string;
  cancelledAt?: string;
  bookedByUserId?: string;
}

export interface DoctorPublic {
  doctorId: string;
  displayName: string;
  specialization: string | null;
  qualifications: string[];
  facilityName: string | null;
  facilityId: string | null;
  consultationModes: string[];
  consultationFee: number | null;
  languages: string[];
  experienceYears: number | null;
  bio: string | null;
  verified: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DoctorsPage {
  doctors: DoctorPublic[];
  pagination: Pagination;
}

export interface WeeklySlot {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  consultationDurationMinutes: number;
  timezone?: string;
}

export interface AvailabilityException {
  date: string;
  reason: string;
  startMinute: number | null;
  endMinute: number | null;
}

export interface DoctorAvailability {
  doctorId: string;
  weekly: WeeklySlot[];
  exceptions: AvailabilityException[];
}

export type RealReferralStatus = 'CREATED' | 'ACCEPTED';

export interface RealReferral {
  referralId: string;
  patientId: string;
  fromDoctorId?: string;
  toFacilityId?: string;
  toDoctorId?: string;
  reason?: string;
  clinicalSummary?: string;
  status: RealReferralStatus;
  createdAt: string;
}

export type TriageRisk = 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT' | 'UNKNOWN';

export interface TriageAssessment {
  triageId: string;
  riskLevel: TriageRisk;
  possibleConditions: string[];
  missingInformation: string[];
  recommendedAction: string;
  modelVersion: string;
  source: 'AI' | 'MANUAL_FALLBACK';
  disclaimer?: string;
}

/* Rule-based symptom assessment (JSON rule engine) */

export interface RuleRedFlag {
  id: string;
  message: string;
  action: string;
}

export interface RuleAssessment {
  riskLevel: TriageRisk;
  riskScore: number;
  possibleConditions: string[];
  redFlags: RuleRedFlag[];
  missingInformation: string[];
  recommendedAction: string;
  reason: string[];
  nextSteps: string[];
  selfCare: string[];
  seekCareIf: string[];
  disclaimer: string;
  modelVersion: string;
  source: 'RULE_ENGINE' | 'MANUAL_FALLBACK';
}

export interface RuleSymptom {
  id: string;
  label: string;
}

export interface RuleSymptomCategory {
  label: string;
  symptoms: RuleSymptom[];
}

export interface RuleVocabulary {
  version: string;
  categories: Record<string, RuleSymptomCategory>;
}

export interface RuleFollowupOption {
  value: string;
  label: string;
}

export interface RuleFollowupQuestion {
  id: string;
  question: string;
  category: string;
  required: boolean;
  options: RuleFollowupOption[];
}

export interface NotificationItem {
  notificationId: string;
  type: 'APPOINTMENT' | 'REFERRAL' | 'FOLLOWUP' | 'CONSENT' | 'PRIVACY' | 'GENERAL';
  title: string;
  body: string;
  read: boolean;
  readAt?: string;
  link?: string;
  createdAt: string;
}

export interface NotificationsPage {
  items: NotificationItem[];
  total: number;
  unread: number;
}

export type FollowUpStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED';

export interface FollowUp {
  followUpId: string;
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  scheduledAt?: string;
  reason?: string;
  instructions?: string;
  status: FollowUpStatus;
  createdAt: string;
}

export interface NearbyHospital {
  name: string;
  address: string;
  type: string;
  distanceMeters?: number;
  source: 'mappls' | 'bhuvan';
  point?: { lat: number; lng: number };
}

export interface NearbyHospitalsResult {
  available: boolean;
  providers: { mappls: boolean; bhuvan: boolean };
  count: number;
  hospitals: NearbyHospital[];
}

export interface PatientSelfProfile {
  patientId?: string;
  internalUserId: string;
  displayName?: string;
  sex?: string;
  dateOfBirth?: string;
  addressDistrict?: string;
  addressRegion?: string;
  languages?: string[];
}

export interface SelfView {
  internalUserId: string;
  role: string;
  profile: PatientSelfProfile | null;
}
