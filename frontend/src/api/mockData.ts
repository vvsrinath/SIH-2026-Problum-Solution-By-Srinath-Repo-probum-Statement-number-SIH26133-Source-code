import type {
  DoctorPublic,
  RealAppointment,
  RealReferral,
  NotificationItem,
  FollowUp,
  NearbyHospitalsResult,
  SelfView,
  DoctorAvailability,
} from '../types';

export interface StoredDocument {
  refId: string;
  filename: string;
  mime: string;
  createdAt: string;
}

/**
 * Mock / offline bootstrap data for the Swasthya Sathi demo.
 *
 * Used as automatic fallbacks when the backend (Node + MongoDB) is not
 * reachable, so the whole MVP still works end-to-end for a demo. All
 * identities, facilities and clinical details are illustrative.
 */

/* ------------------------------ self ------------------------------ */

export const mockSelf: SelfView = {
  internalUserId: 'mock-patient-1001',
  role: 'PATIENT',
  profile: {
    internalUserId: 'mock-patient-1001',
    patientId: 'p-1001',
    displayName: 'Ramesh Kumar',
    sex: 'MALE',
    dateOfBirth: '1978-06-14',
    addressDistrict: 'Patna',
    addressRegion: 'Bihar',
    languages: ['Hindi', 'English'],
  },
};

export const mockAuthMe = {
  internalUserId: 'mock-patient-1001',
  role: 'PATIENT',
  status: 'ACTIVE',
  lastLoginAt: new Date().toISOString(),
};

/* ----------------------------- doctors ----------------------------- */

function doc(
  doctorId: string,
  displayName: string,
  specialization: string | null,
  qualifications: string[],
  facilityName: string | null,
  consultationModes: string[],
  consultationFee: number | null,
  languages: string[],
  experienceYears: number | null,
  verified: boolean,
): DoctorPublic {
  return {
    doctorId,
    displayName,
    specialization,
    qualifications,
    facilityName,
    facilityId: facilityName ? `fac-${doctorId}` : null,
    consultationModes,
    consultationFee,
    languages,
    experienceYears,
    bio: null,
    verified,
  };
}

export const mockDoctors: DoctorPublic[] = [
  doc('d-1', 'Dr. Arjun Sharma', 'General Physician', ['MBBS', 'MD (General Medicine)'], 'Primary Health Centre, Danapur', ['IN_PERSON', 'VIDEO', 'AUDIO'], 150, ['English', 'Hindi'], 12, true),
  doc('d-2', 'Dr. Kavita Rao', 'Family Medicine', ['MBBS', 'DNB (Family Medicine)'], 'Community Health Centre, Patna', ['IN_PERSON', 'VIDEO'], 120, ['English', 'Hindi', 'Marathi'], 9, true),
  doc('d-3', 'Dr. Imran Qureshi', 'General Physician', ['MBBS'], 'Sunrise Clinic', ['IN_PERSON'], 100, ['English', 'Urdu', 'Hindi'], 7, true),
  doc('d-4', 'Dr. Neha Verma', 'Cardiologist', ['MBBS', 'MD', 'DM (Cardiology)'], 'District Hospital, Patna', ['IN_PERSON', 'VIDEO'], 600, ['English', 'Hindi'], 15, true),
  doc('d-5', 'Dr. Rajiv Menon', 'Pulmonologist', ['MBBS', 'MD (Pulmonology)'], 'District Hospital, Patna', ['IN_PERSON', 'VIDEO'], 500, ['English', 'Hindi', 'Malayalam'], 13, true),
  doc('d-6', 'Dr. Priya Nair', 'Endocrinologist', ['MBBS', 'MD', 'DM (Endocrinology)'], 'Life Care Hospital', ['IN_PERSON', 'VIDEO'], 550, ['English', 'Hindi', 'Tamil', 'Malayalam'], 11, true),
  doc('d-7', 'Dr. Anita Joshi', 'Gynecologist', ['MBBS', 'MS (Obstetrics & Gynaecology)'], 'Sub-District Hospital, Danapur', ['IN_PERSON', 'VIDEO'], 400, ['English', 'Hindi'], 14, true),
  doc('d-8', 'Dr. Manish Gupta', 'Orthopedist', ['MBBS', 'MS (Orthopaedics)'], 'Life Care Hospital', ['IN_PERSON'], 450, ['English', 'Hindi'], 10, true),
  doc('d-9', 'Dr. Sunita Iyer', 'Pediatrician', ['MBBS', 'MD (Paediatrics)'], 'Community Health Centre, Patna', ['IN_PERSON', 'VIDEO', 'AUDIO'], 250, ['English', 'Hindi', 'Tamil'], 8, true),
  doc('d-10', 'Dr. Rohit Sharma', 'Dermatologist', ['MBBS', 'MD (Dermatology)'], 'Skin & Wellness Clinic', ['IN_PERSON', 'VIDEO'], 350, ['English', 'Hindi'], 6, true),
];

/* --------------------------- appointments --------------------------- */

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function isoIn(daysFromNow: number, h: number, m = 0): string {
  const d = new Date(now + daysFromNow * day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const mockAppointments: RealAppointment[] = [
  {
    appointmentId: 'mock-appt-1',
    patientId: 'p-1001',
    doctorId: 'd-1',
    facilityId: 'fac-d-1',
    scheduledAt: isoIn(1, 10, 30),
    durationMinutes: 30,
    consultationType: 'IN_PERSON',
    status: 'CONFIRMED',
    reason: 'Fever and body ache',
  },
  {
    appointmentId: 'mock-appt-2',
    patientId: 'p-1001',
    doctorId: 'd-4',
    facilityId: 'fac-d-4',
    scheduledAt: isoIn(3, 16, 0),
    durationMinutes: 30,
    consultationType: 'VIDEO',
    status: 'BOOKED',
    reason: 'Cardiology referral consult',
  },
  {
    appointmentId: 'mock-appt-3',
    patientId: 'p-1001',
    doctorId: 'd-1',
    facilityId: 'fac-d-1',
    scheduledAt: isoIn(-3, 11, 0),
    durationMinutes: 30,
    consultationType: 'IN_PERSON',
    status: 'COMPLETED',
    reason: 'General check-up',
  },
  {
    appointmentId: 'mock-appt-4',
    patientId: 'p-1001',
    doctorId: 'd-2',
    facilityId: 'fac-d-2',
    scheduledAt: isoIn(0, 11, 0),
    durationMinutes: 20,
    consultationType: 'AUDIO',
    status: 'IN_PROGRESS',
    reason: 'Fever not settling — audio consult',
  },
  {
    appointmentId: 'mock-appt-5',
    patientId: 'p-1001',
    doctorId: 'd-5',
    facilityId: 'fac-d-5',
    scheduledAt: isoIn(-6, 15, 30),
    durationMinutes: 30,
    consultationType: 'VIDEO',
    status: 'COMPLETED',
    reason: 'Persistent cough — pulmonary review',
  },
  {
    appointmentId: 'mock-appt-6',
    patientId: 'p-1001',
    doctorId: 'd-8',
    facilityId: 'fac-d-8',
    scheduledAt: isoIn(-12, 10, 0),
    durationMinutes: 30,
    consultationType: 'IN_PERSON',
    status: 'CANCELLED',
    reason: 'Knee pain consult',
    cancelledBy: 'PATIENT',
    cancelledReason: 'Conflict with travel schedule',
    cancelledAt: isoIn(-13, 17, 45),
  },
  {
    appointmentId: 'mock-appt-7',
    patientId: 'p-1001',
    doctorId: 'd-6',
    facilityId: 'fac-d-6',
    scheduledAt: isoIn(-20, 9, 30),
    durationMinutes: 30,
    consultationType: 'IN_PERSON',
    status: 'COMPLETED',
    reason: 'Diabetes management review',
  },
  {
    appointmentId: 'mock-appt-8',
    patientId: 'p-1001',
    doctorId: 'd-3',
    facilityId: 'fac-d-3',
    scheduledAt: isoIn(-5, 12, 0),
    durationMinutes: 20,
    consultationType: 'IN_PERSON',
    status: 'NO_SHOW',
    reason: 'Wound dressing follow-up',
  },
  {
    appointmentId: 'mock-appt-9',
    patientId: 'p-1001',
    doctorId: 'd-5',
    facilityId: 'fac-d-5',
    scheduledAt: isoIn(4, 17, 0),
    durationMinutes: 30,
    consultationType: 'VIDEO',
    status: 'CONFIRMED',
    reason: 'Cough — week 4 review',
  },
  {
    appointmentId: 'mock-appt-10',
    patientId: 'p-1001',
    doctorId: 'd-9',
    facilityId: 'fac-d-9',
    scheduledAt: isoIn(7, 11, 30),
    durationMinutes: 20,
    consultationType: 'VIDEO',
    status: 'CONFIRMED',
    reason: 'Immunisation schedule review',
  },
  {
    appointmentId: 'mock-appt-11',
    patientId: 'p-1001',
    doctorId: 'd-2',
    facilityId: 'fac-d-2',
    scheduledAt: isoIn(2, 12, 0),
    durationMinutes: 20,
    consultationType: 'AUDIO',
    status: 'BOOKED',
    reason: 'Fever recovery follow-up',
  },
  {
    appointmentId: 'mock-appt-12',
    patientId: 'p-1001',
    doctorId: 'd-7',
    facilityId: 'fac-d-7',
    scheduledAt: isoIn(-30, 10, 30),
    durationMinutes: 30,
    consultationType: 'IN_PERSON',
    status: 'COMPLETED',
    reason: 'Routine family health check',
  },
];

export const mockAvailability: Record<string, DoctorAvailability> = {
  'd-1': {
    doctorId: 'd-1',
    weekly: [
      { dayOfWeek: 0, startMinute: 540, endMinute: 720, consultationDurationMinutes: 30 },
      { dayOfWeek: 1, startMinute: 540, endMinute: 1020, consultationDurationMinutes: 30 },
      { dayOfWeek: 2, startMinute: 540, endMinute: 1020, consultationDurationMinutes: 30 },
      { dayOfWeek: 3, startMinute: 540, endMinute: 1020, consultationDurationMinutes: 30 },
      { dayOfWeek: 4, startMinute: 540, endMinute: 1020, consultationDurationMinutes: 30 },
      { dayOfWeek: 5, startMinute: 540, endMinute: 720, consultationDurationMinutes: 30 },
    ],
    exceptions: [],
  },
  'd-4': {
    doctorId: 'd-4',
    weekly: [
      { dayOfWeek: 1, startMinute: 600, endMinute: 840, consultationDurationMinutes: 30 },
      { dayOfWeek: 3, startMinute: 600, endMinute: 840, consultationDurationMinutes: 30 },
      { dayOfWeek: 5, startMinute: 600, endMinute: 840, consultationDurationMinutes: 30 },
    ],
    exceptions: [],
  },
  'd-2': {
    doctorId: 'd-2',
    weekly: [
      { dayOfWeek: 2, startMinute: 540, endMinute: 840, consultationDurationMinutes: 20 },
      { dayOfWeek: 4, startMinute: 540, endMinute: 840, consultationDurationMinutes: 20 },
      { dayOfWeek: 6, startMinute: 600, endMinute: 780, consultationDurationMinutes: 20 },
    ],
    exceptions: [],
  },
  'd-6': {
    doctorId: 'd-6',
    weekly: [
      { dayOfWeek: 1, startMinute: 600, endMinute: 960, consultationDurationMinutes: 30 },
      { dayOfWeek: 4, startMinute: 600, endMinute: 780, consultationDurationMinutes: 30 },
    ],
    exceptions: [],
  },
  'd-5': {
    doctorId: 'd-5',
    weekly: [
      { dayOfWeek: 3, startMinute: 600, endMinute: 900, consultationDurationMinutes: 30 },
      { dayOfWeek: 5, startMinute: 600, endMinute: 840, consultationDurationMinutes: 30 },
    ],
    exceptions: [],
  },
  'd-9': {
    doctorId: 'd-9',
    weekly: [
      { dayOfWeek: 0, startMinute: 600, endMinute: 840, consultationDurationMinutes: 20 },
      { dayOfWeek: 2, startMinute: 600, endMinute: 960, consultationDurationMinutes: 20 },
      { dayOfWeek: 5, startMinute: 600, endMinute: 900, consultationDurationMinutes: 20 },
    ],
    exceptions: [],
  },
};

/* ---------------------------- referrals ---------------------------- */

export const mockReferrals: RealReferral[] = [
  {
    referralId: 'mock-ref-1',
    patientId: 'p-1001',
    fromDoctorId: 'd-1',
    toDoctorId: 'd-4',
    toFacilityId: 'fac-d-4',
    reason: 'Irregular pulse noted during consultation',
    clinicalSummary: 'ECG advised; refer for cardiology evaluation.',
    status: 'CREATED',
    createdAt: isoIn(-1, 9, 0),
  },
  {
    referralId: 'mock-ref-2',
    patientId: 'p-1001',
    fromDoctorId: 'd-6',
    toDoctorId: 'd-1',
    reason: 'Diabetes management review',
    clinicalSummary: 'Blood sugar follow-up and medication review.',
    status: 'ACCEPTED',
    createdAt: isoIn(-8, 12, 0),
  },
  {
    referralId: 'mock-ref-3',
    patientId: 'p-1001',
    fromDoctorId: 'd-5',
    toDoctorId: 'd-9',
    toFacilityId: 'fac-d-9',
    reason: 'Persistent cough in a child — paediatric opinion',
    clinicalSummary: 'Cough persisting beyond 4 weeks despite treatment.',
    status: 'ACCEPTED',
    createdAt: isoIn(-5, 14, 30),
  },
  {
    referralId: 'mock-ref-4',
    patientId: 'p-1001',
    fromDoctorId: 'd-1',
    toDoctorId: 'd-6',
    toFacilityId: 'fac-d-6',
    reason: 'Pre-diabetes — endocrinology consult',
    clinicalSummary: 'Fasting glucose 108 mg/dL. Dietary counselling done.',
    status: 'ACCEPTED',
    createdAt: isoIn(-26, 11, 0),
  },
];

/* --------------------------- notifications --------------------------- */

export const mockNotifications: NotificationItem[] = [
  {
    notificationId: 'mock-notif-1',
    type: 'APPOINTMENT',
    title: 'Appointment confirmed',
    body: 'Your appointment with Dr. Arjun Sharma is confirmed for tomorrow at 10:30 AM.',
    read: false,
    link: '/patient/appointments',
    createdAt: isoIn(0, 8, 0),
  },
  {
    notificationId: 'mock-notif-2',
    type: 'REFERRAL',
    title: 'Referral accepted',
    body: 'Dr. Neha Verma accepted your cardiology referral. Please book a follow-up visit.',
    read: false,
    link: '/patient/referrals',
    createdAt: isoIn(-1, 11, 0),
  },
  {
    notificationId: 'mock-notif-3',
    type: 'FOLLOWUP',
    title: 'Follow-up reminder',
    body: 'Your diabetes follow-up is scheduled. Please carry your recent reports.',
    read: true,
    link: '/patient/follow-up',
    createdAt: isoIn(-2, 9, 0),
  },
  {
    notificationId: 'mock-notif-4',
    type: 'CONSENT',
    title: 'Consent reminder',
    body: 'Please review your data-sharing consent for your new doctor.',
    read: false,
    link: '/patient/notifications',
    createdAt: isoIn(-3, 15, 0),
  },
  {
    notificationId: 'mock-notif-5',
    type: 'REFERRAL',
    title: 'Lab report ready',
    body: 'Your Complete Blood Count report from District Hospital, Patna is now available in your records.',
    read: false,
    link: '/patient/records',
    createdAt: isoIn(0, 7, 30),
  },
  {
    notificationId: 'mock-notif-6',
    type: 'FOLLOWUP',
    title: 'Medicine refill reminder',
    body: 'Your Paracetamol 500 mg prescription ends in 2 days. Ask your doctor for a refill if needed.',
    read: true,
    link: '/patient/medicines',
    createdAt: isoIn(-1, 8, 15),
  },
  {
    notificationId: 'mock-notif-7',
    type: 'REFERRAL',
    title: 'Referral response received',
    body: 'PHC Danapur has acknowledged your cardiology referral. You will be contacted with next steps.',
    read: true,
    link: '/patient/referrals',
    createdAt: isoIn(-2, 14, 0),
  },
  {
    notificationId: 'mock-notif-8',
    type: 'APPOINTMENT',
    title: 'New appointment booked',
    body: 'Your audio consult with Dr. Kavita Rao is confirmed for today at 11:00 AM.',
    read: false,
    link: '/patient/appointments',
    createdAt: isoIn(0, 8, 30),
  },
  {
    notificationId: 'mock-notif-9',
    type: 'CONSENT',
    title: 'ABDM - Health data sharing',
    body: 'Dr. Rajiv Menon has requested access to your health records via ABDM with your consent.',
    read: true,
    link: '/patient/notifications',
    createdAt: isoIn(-4, 16, 45),
  },
  {
    notificationId: 'mock-notif-10',
    type: 'FOLLOWUP',
    title: 'Wound dressing reminder',
    body: 'The wound care clinic reminded you to change the dressing twice daily as instructed.',
    read: true,
    link: '/patient/follow-up',
    createdAt: isoIn(-6, 10, 0),
  },
  {
    notificationId: 'mock-notif-11',
    type: 'APPOINTMENT',
    title: 'Appointment rescheduled',
    body: 'Dr. Neha Verma moved your cardiology consult from Thursday to Monday at 4:00 PM.',
    read: false,
    link: '/patient/appointments',
    createdAt: isoIn(0, 6, 45),
  },
  {
    notificationId: 'mock-notif-12',
    type: 'REFERRAL',
    title: 'Lab order placed',
    body: 'Your doctor has ordered a Lipid Profile at District Hospital, Patna. Book a slot to give a sample.',
    read: false,
    link: '/patient/records',
    createdAt: isoIn(0, 9, 20),
  },
];

export const mockNotificationPage = {
  items: mockNotifications,
  total: mockNotifications.length,
  unread: mockNotifications.filter((n) => !n.read).length,
};

/* ----------------------------- follow-ups ----------------------------- */

export const mockFollowUps: FollowUp[] = [
  {
    followUpId: 'mock-fup-1',
    patientId: 'p-1001',
    doctorId: 'd-1',
    appointmentId: 'mock-appt-1',
    scheduledAt: isoIn(7, 10, 0),
    reason: 'Review fever response',
    instructions: 'Carry updated temperature log.',
    status: 'SCHEDULED',
    createdAt: isoIn(0, 9, 0),
  },
  {
    followUpId: 'mock-fup-2',
    patientId: 'p-1001',
    doctorId: 'd-6',
    reason: 'Diabetes follow-up',
    status: 'COMPLETED',
    createdAt: isoIn(-8, 12, 30),
  },
  {
    followUpId: 'mock-fup-3',
    patientId: 'p-1001',
    doctorId: 'd-5',
    appointmentId: 'mock-appt-5',
    scheduledAt: isoIn(2, 9, 0),
    reason: 'Cough follow-up',
    instructions: 'Carry the latest sputum report.',
    status: 'PENDING',
    createdAt: isoIn(-1, 16, 20),
  },
  {
    followUpId: 'mock-fup-4',
    patientId: 'p-1001',
    doctorId: 'd-6',
    reason: 'Diabetes monthly review',
    instructions: 'Compare fasting and post-meal sugar readings.',
    status: 'COMPLETED',
    createdAt: isoIn(-18, 12, 0),
  },
  {
    followUpId: 'mock-fup-5',
    patientId: 'p-1001',
    doctorId: 'd-5',
    appointmentId: 'mock-appt-9',
    scheduledAt: isoIn(11, 17, 0),
    reason: 'Cough — 6 week review',
    instructions: 'Carry repeat chest X-ray if done.',
    status: 'SCHEDULED',
    createdAt: isoIn(0, 10, 0),
  },
  {
    followUpId: 'mock-fup-6',
    patientId: 'p-1001',
    doctorId: 'd-2',
    scheduledAt: isoIn(5, 12, 0),
    reason: 'Anaemia reassessment',
    instructions: 'Get a repeat Haemoglobin test before the visit.',
    status: 'PENDING',
    createdAt: isoIn(0, 8, 40),
  },
  {
    followUpId: 'mock-fup-7',
    patientId: 'p-1001',
    doctorId: 'd-6',
    scheduledAt: isoIn(-26, 12, 0),
    reason: 'Pre-diabetes counselling',
    status: 'SCHEDULED',
    createdAt: isoIn(-30, 9, 0),
  },
];

/* ------------------------- nearby healthcare ------------------------- */

export const mockNearbyHospitals: NearbyHospitalsResult = {
  available: true,
  providers: { mappls: true, bhuvan: true },
  count: 9,
  hospitals: [
    { name: 'Primary Health Centre, Danapur', address: 'Danapur, Patna, Bihar', type: 'PHC', distanceMeters: 1200, source: 'bhuvan', point: { lat: 25.5804, lng: 85.0912 } },
    { name: 'Community Health Centre, Patna', address: 'Patna, Bihar', type: 'CHC', distanceMeters: 2800, source: 'bhuvan', point: { lat: 25.5941, lng: 85.1376 } },
    { name: 'District Hospital, Patna', address: 'Patna, Bihar', type: 'District Hospital', distanceMeters: 4500, source: 'mappls', point: { lat: 25.6112, lng: 85.1418 } },
    { name: 'Life Care Hospital', address: 'Patna, Bihar', type: 'Multi-speciality', distanceMeters: 3500, source: 'mappls', point: { lat: 25.6255, lng: 85.1225 } },
    { name: 'Sub-District Hospital, Danapur', address: 'Danapur, Patna, Bihar', type: 'Sub-District Hospital', distanceMeters: 6000, source: 'bhuvan', point: { lat: 25.5602, lng: 85.0704 } },
    { name: 'Gramin Health Sub-Centre', address: 'Rural Ward, Bihar', type: 'Rural Health Centre', distanceMeters: 6400, source: 'bhuvan', point: { lat: 25.5701, lng: 85.0608 } },
    { name: 'Sunrise Clinic', address: 'Patna, Bihar', type: 'Primary Clinic', distanceMeters: 2100, source: 'mappls', point: { lat: 25.5919, lng: 85.1152 } },
    { name: 'Mother & Child Wellness Centre', address: 'Danapur, Patna, Bihar', type: 'Women & Child Clinic', distanceMeters: 3900, source: 'mappls', point: { lat: 25.5991, lng: 85.0795 } },
    { name: 'Sub-Health Centre, Fatuha', address: 'Fatuha, Patna, Bihar', type: 'Rural Health Centre', distanceMeters: 7100, source: 'bhuvan', point: { lat: 25.5357, lng: 85.1993 } },
  ],
};

/* ------------------------------ records ------------------------------ */

export const mockDocuments: StoredDocument[] = [
  {
    refId: 'mock-doc-1',
    filename: 'Blood Report - June 2026.pdf',
    mime: 'application/pdf',
    createdAt: isoIn(-20, 10, 0),
  },
  {
    refId: 'mock-doc-2',
    filename: 'X-Ray Chest.jpg',
    mime: 'image/jpeg',
    createdAt: isoIn(-15, 14, 30),
  },
  {
    refId: 'mock-doc-3',
    filename: 'Prescription - Paracetamol.png',
    mime: 'image/png',
    createdAt: isoIn(-3, 9, 15),
  },
  {
    refId: 'mock-doc-4',
    filename: 'Immunization Card - Record.txt',
    mime: 'text/plain',
    createdAt: isoIn(-40, 11, 0),
  },
  {
    refId: 'mock-doc-5',
    filename: 'ECG Report - Cardiology.pdf',
    mime: 'application/pdf',
    createdAt: isoIn(-7, 15, 0),
  },
  {
    refId: 'mock-doc-6',
    filename: 'Blood Sugar Log - June 2026.csv',
    mime: 'text/csv',
    createdAt: isoIn(-18, 9, 45),
  },
  {
    refId: 'mock-doc-7',
    filename: 'Chest X-Ray - Follow Up.jpg',
    mime: 'image/jpeg',
    createdAt: isoIn(-45, 13, 20),
  },
  {
    refId: 'mock-doc-8',
    filename: 'Physician Note - Fever Progress.txt',
    mime: 'text/plain',
    createdAt: isoIn(-3, 12, 30),
  },
];
