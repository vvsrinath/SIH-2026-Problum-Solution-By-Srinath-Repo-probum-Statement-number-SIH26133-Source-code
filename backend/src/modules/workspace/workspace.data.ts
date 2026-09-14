/**
 * Live demo dataset for role workspace endpoints.
 *
 * Served from the backend so the frontend consumes real HTTP responses
 * instead of falling back to its bundled mocks. Data is in-memory only.
 */

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
function isoIn(daysFromNow: number, h: number, m = 0): string {
  const d = new Date(now + daysFromNow * day);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

/* ------------------------------- worker ------------------------------- */

export const workerOverview = {
  households: 42,
  patients: 118,
  visitsToday: 6,
  pendingFollowUps: 4,
  referralsThisWeek: 3,
  highRiskPatients: 2,
};

export const workerPatients = [
  { patientId: 'wp-1', name: 'Ramesh Kumar', village: 'Danapur', age: 47, sex: 'MALE', condition: 'Fever recovery', risk: 'MODERATE', lastVisitAt: isoIn(-2, 9, 0), nextVisitAt: isoIn(0, 14, 0) },
  { patientId: 'wp-2', name: 'Geeta Pal', village: 'Sugut', age: 24, sex: 'FEMALE', condition: 'Anaemia monitoring', risk: 'HIGH', lastVisitAt: isoIn(-3, 11, 0), nextVisitAt: isoIn(1, 10, 0) },
  { patientId: 'wp-3', name: 'Mohit Prasad', village: 'Punpun', age: 35, sex: 'MALE', condition: 'Diabetes review', risk: 'MODERATE', lastVisitAt: isoIn(-6, 16, 0), nextVisitAt: isoIn(2, 15, 0) },
  { patientId: 'wp-4', name: 'Sunita Ram', village: 'Danapur', age: 58, sex: 'FEMALE', condition: 'Hypertension check', risk: 'URGENT', lastVisitAt: isoIn(-1, 10, 0), nextVisitAt: isoIn(0, 15, 30) },
  { patientId: 'wp-5', name: 'Kamla Devi', village: 'Sugut', age: 31, sex: 'FEMALE', condition: 'Antenatal follow-up', risk: 'LOW', lastVisitAt: isoIn(-9, 12, 0), nextVisitAt: isoIn(5, 11, 0) },
  { patientId: 'wp-6', name: 'Anjali Devi', village: 'Punpun', age: 29, sex: 'FEMALE', condition: 'Fever with rash', risk: 'HIGH', lastVisitAt: isoIn(-1, 13, 0), nextVisitAt: isoIn(0, 16, 0) },
  { patientId: 'wp-7', name: 'Bhola Sahu', village: 'Danapur', age: 62, sex: 'MALE', condition: 'Post-surgery wound follow-up', risk: 'MODERATE', lastVisitAt: isoIn(-5, 10, 0), nextVisitAt: isoIn(1, 11, 0) },
  { patientId: 'wp-8', name: 'Poonam Singh', village: 'Sugut', age: 28, sex: 'FEMALE', condition: 'Postnatal care', risk: 'LOW', lastVisitAt: isoIn(-2, 9, 30), nextVisitAt: isoIn(3, 10, 0) },
  { patientId: 'wp-9', name: 'Munna Kumar', village: 'Punpun', age: 8, sex: 'MALE', condition: 'Child immunisation — DPT booster', risk: 'LOW', lastVisitAt: isoIn(-7, 14, 0), nextVisitAt: isoIn(21, 10, 0) },
  { patientId: 'wp-10', name: 'Sita Devi', village: 'Danapur', age: 55, sex: 'FEMALE', condition: 'Hypertension + diabetes', risk: 'HIGH', lastVisitAt: isoIn(-1, 16, 0), nextVisitAt: isoIn(0, 10, 0) },
  { patientId: 'wp-11', name: 'Ashok Mehta', village: 'Sugut', age: 52, sex: 'MALE', condition: 'Chronic wound — diabetic foot', risk: 'URGENT', lastVisitAt: isoIn(0, 8, 0), nextVisitAt: isoIn(0, 14, 0) },
  { patientId: 'wp-12', name: 'Lata Devi', village: 'Punpun', age: 40, sex: 'FEMALE', condition: 'Thyroid monitoring', risk: 'LOW', lastVisitAt: isoIn(-10, 11, 0), nextVisitAt: isoIn(20, 9, 0) },
  { patientId: 'wp-13', name: 'Raju Manjhi', village: 'Danapur', age: 41, sex: 'MALE', condition: 'Acute abdominal pain — investigation', risk: 'HIGH', lastVisitAt: isoIn(0, 9, 0), nextVisitAt: isoIn(0, 16, 0) },
  { patientId: 'wp-14', name: 'Pooja Sinha', village: 'Sugut', age: 33, sex: 'FEMALE', condition: 'TB treatment — DOTS month 3', risk: 'MODERATE', lastVisitAt: isoIn(-3, 10, 30), nextVisitAt: isoIn(4, 10, 0) },
];

export const workerTriage = [
  { id: 'tn-1', patientName: 'Sunita Ram', capturedAt: isoIn(0, 10, 15), symptoms: 'High BP 168/104, headache, chest tightness', risk: 'URGENT', outcome: 'Referred to PHC emergency queue' },
  { id: 'tn-2', patientName: 'Ramesh Kumar', capturedAt: isoIn(-2, 9, 45), symptoms: 'Fever 101°F, cough, body ache since 3 days', risk: 'MODERATE', outcome: 'Advice + symptom log, doctor consult advised' },
  { id: 'tn-3', patientName: 'Geeta Pal', capturedAt: isoIn(-3, 11, 30), symptoms: 'Pallor, fatigue, dizziness', risk: 'HIGH', outcome: 'Referred to doctor for CBC' },
  { id: 'tn-4', patientName: 'Kamla Devi', capturedAt: isoIn(-9, 12, 20), symptoms: 'Routine antenatal vitals', risk: 'LOW', outcome: 'Home-based screening completed' },
  { id: 'tn-5', patientName: 'Ashok Mehta', capturedAt: isoIn(0, 8, 10), symptoms: 'Diabetic wound — 3 cm, pus discharge, foul smell', risk: 'URGENT', outcome: 'Referred to district hospital for wound debridement' },
  { id: 'tn-6', patientName: 'Raju Manjhi', capturedAt: isoIn(0, 9, 5), symptoms: 'Severe epigastric pain radiating to back, nausea, no fever', risk: 'HIGH', outcome: 'Ultrasound advised, referred to PHC for IV fluids' },
  { id: 'tn-7', patientName: 'Poonam Singh', capturedAt: isoIn(-2, 9, 30), symptoms: 'Mild cough, runny nose, no fever', risk: 'LOW', outcome: 'Symptomatic treatment advised, follow-up in 1 week' },
  { id: 'tn-8', patientName: 'Pooja Sinha', capturedAt: isoIn(-3, 10, 30), symptoms: 'Monthly DOTS check — no cough, weight stable', risk: 'LOW', outcome: 'Treatment on track, next sputum test in 1 month' },
];

export const workerReferrals = [
  { id: 'wr-1', patientName: 'Sunita Ram', toFacility: 'Primary Health Centre, Danapur', reason: 'Uncontrolled hypertension with red-flag symptoms', status: 'CREATED', createdAt: isoIn(0, 10, 20) },
  { id: 'wr-2', patientName: 'Geeta Pal', toFacility: 'Community Health Centre, Patna', reason: 'Severe anaemia, needs CBC and physician review', status: 'ACCEPTED', createdAt: isoIn(-3, 11, 40) },
  { id: 'wr-3', patientName: 'Mohit Prasad', toFacility: 'District Hospital, Patna', reason: 'Diabetic foot risk assessment', status: 'COMPLETED', createdAt: isoIn(-8, 15, 10) },
  { id: 'wr-4', patientName: 'Anjali Devi', toFacility: 'Community Health Centre, Patna', reason: 'Fever with rash — dengue screening', status: 'CREATED', createdAt: isoIn(0, 9, 10) },
  { id: 'wr-5', patientName: 'Ashok Mehta', toFacility: 'District Hospital, Patna', reason: 'Diabetic wound debridement needed', status: 'CREATED', createdAt: isoIn(0, 8, 20) },
  { id: 'wr-6', patientName: 'Raju Manjhi', toFacility: 'Primary Health Centre, Danapur', reason: 'Acute abdomen — needs ultrasound and observation', status: 'ACCEPTED', createdAt: isoIn(0, 9, 15) },
  { id: 'wr-7', patientName: 'Sita Devi', toFacility: 'Community Health Centre, Patna', reason: 'BP not controlled despite medication — specialist review', status: 'ACCEPTED', createdAt: isoIn(-1, 16, 10) },
  { id: 'wr-8', patientName: 'Pooja Sinha', toFacility: 'District Hospital, Patna', reason: 'TB treatment — month 3 sputum follow-up', status: 'COMPLETED', createdAt: isoIn(-3, 10, 40) },
];

export const workerFollowUps = [
  { id: 'wf-1', patientName: 'Ramesh Kumar', scheduledAt: isoIn(0, 14, 0), kind: 'Fever revisit', status: 'SCHEDULED' },
  { id: 'wf-2', patientName: 'Sunita Ram', scheduledAt: isoIn(0, 15, 30), kind: 'BP monitoring', status: 'SCHEDULED' },
  { id: 'wf-3', patientName: 'Geeta Pal', scheduledAt: isoIn(1, 10, 0), kind: 'Incentive counselling', status: 'SCHEDULED' },
  { id: 'wf-4', patientName: 'Kamla Devi', scheduledAt: isoIn(-4, 12, 0), kind: 'Antenatal education', status: 'COMPLETED' },
  { id: 'wf-5', patientName: 'Mohit Prasad', scheduledAt: isoIn(2, 16, 0), kind: 'Diabetes foot check', status: 'SCHEDULED' },
  { id: 'wf-6', patientName: 'Ashok Mehta', scheduledAt: isoIn(0, 14, 0), kind: 'Wound dressing check', status: 'SCHEDULED' },
  { id: 'wf-7', patientName: 'Sita Devi', scheduledAt: isoIn(0, 10, 0), kind: 'BP morning reading', status: 'SCHEDULED' },
  { id: 'wf-8', patientName: 'Raju Manjhi', scheduledAt: isoIn(0, 16, 0), kind: 'Post-investigation follow-up', status: 'SCHEDULED' },
  { id: 'wf-9', patientName: 'Pooja Sinha', scheduledAt: isoIn(4, 10, 0), kind: 'DOTS month 4 sputum test', status: 'SCHEDULED' },
];

/* ---------------------------------- PHC ---------------------------------- */

export const phcOverview = {
  queueCount: 9,
  patientsToday: 34,
  bedsOccupied: 5,
  bedsTotal: 10,
  medicinesLow: 3,
  pendingReferrals: 2,
};

export const phcQueue = [
  { token: 'A-104', patientName: 'Sunita Ram', reason: 'Hypertension emergency', severity: 'URGENT', waitingMin: 8, status: 'IN_CONSULTATION' },
  { token: 'A-105', patientName: 'Ramesh Kumar', reason: 'Fever follow-up', severity: 'MODERATE', waitingMin: 22, status: 'WAITING' },
  { token: 'A-106', patientName: 'Mohit Prasad', reason: 'Diabetes review', severity: 'MODERATE', waitingMin: 26, status: 'WAITING' },
  { token: 'A-107', patientName: 'Kamla Devi', reason: 'Antenatal visit', severity: 'LOW', waitingMin: 34, status: 'WAITING' },
  { token: 'A-108', patientName: 'Ashok Mehta', reason: 'Wound dressing', severity: 'HIGH', waitingMin: 12, status: 'WAITING' },
  { token: 'A-109', patientName: 'Poonam Singh', reason: 'Cough and cold', severity: 'LOW', waitingMin: 41, status: 'WAITING' },
  { token: 'A-110', patientName: 'Bhola Sahu', reason: 'Immunization', severity: 'LOW', waitingMin: 47, status: 'WAITING' },
  { token: 'A-111', patientName: 'Raju Manjhi', reason: 'Acute abdominal pain', severity: 'URGENT', waitingMin: 5, status: 'WAITING' },
  { token: 'A-112', patientName: 'Sita Devi', reason: 'Gynaecology review', severity: 'HIGH', waitingMin: 18, status: 'WAITING' },
  { token: 'A-113', patientName: 'Sita Devi', reason: 'BP check — medication review', severity: 'MODERATE', waitingMin: 15, status: 'WAITING' },
  { token: 'A-114', patientName: 'Lata Devi', reason: 'Thyroid report review', severity: 'LOW', waitingMin: 38, status: 'WAITING' },
  { token: 'A-115', patientName: 'Pooja Sinha', reason: 'DOTS monthly check', severity: 'LOW', waitingMin: 52, status: 'WAITING' },
  { token: 'A-116', patientName: 'Munna Kumar', reason: 'DPT booster vaccination', severity: 'LOW', waitingMin: 28, status: 'WAITING' },
  { token: 'A-117', patientName: 'Geeta Pal', reason: 'Iron infusion follow-up', severity: 'MODERATE', waitingMin: 20, status: 'WAITING' },
];

export const phcPatients = [
  { patientId: 'ph-1', name: 'Ramesh Kumar', age: 47, sex: 'MALE', reason: 'Fever recovery', lastVisitAt: isoIn(-1, 10, 0) },
  { patientId: 'ph-2', name: 'Geeta Pal', age: 24, sex: 'FEMALE', reason: 'Anaemia follow-up', lastVisitAt: isoIn(-2, 9, 0) },
  { patientId: 'ph-3', name: 'Mohit Prasad', age: 35, sex: 'MALE', reason: 'Diabetes review', lastVisitAt: isoIn(-6, 11, 0) },
  { patientId: 'ph-4', name: 'Kamla Devi', age: 31, sex: 'FEMALE', reason: 'Antenatal care', lastVisitAt: isoIn(-4, 12, 0) },
  { patientId: 'ph-5', name: 'Ashok Mehta', age: 52, sex: 'MALE', reason: 'Wound care', lastVisitAt: isoIn(0, 8, 0) },
  { patientId: 'ph-6', name: 'Raju Manjhi', age: 41, sex: 'MALE', reason: 'Acute pain review', lastVisitAt: isoIn(0, 9, 0) },
  { patientId: 'ph-7', name: 'Poonam Singh', age: 28, sex: 'FEMALE', reason: 'Postnatal check-up', lastVisitAt: isoIn(-2, 9, 30) },
  { patientId: 'ph-8', name: 'Munna Kumar', age: 8, sex: 'MALE', reason: 'Vaccination', lastVisitAt: isoIn(0, 10, 0) },
  { patientId: 'ph-9', name: 'Lata Devi', age: 40, sex: 'FEMALE', reason: 'Thyroid monitoring', lastVisitAt: isoIn(-10, 11, 0) },
  { patientId: 'ph-10', name: 'Sita Devi', age: 55, sex: 'FEMALE', reason: 'Hypertension + diabetes', lastVisitAt: isoIn(-1, 16, 0) },
  { patientId: 'ph-11', name: 'Bhola Sahu', age: 62, sex: 'MALE', reason: 'Post-surgery wound care', lastVisitAt: isoIn(-5, 10, 0) },
  { patientId: 'ph-12', name: 'Pooja Sinha', age: 33, sex: 'FEMALE', reason: 'TB treatment monitoring', lastVisitAt: isoIn(-3, 10, 30) },
];

export const phcReferrals = [
  { id: 'pr-1', patientName: 'Sunita Ram', direction: 'OUTGOING', counterpart: 'District Hospital, Patna', reason: 'Cardiology evaluation', status: 'ACCEPTED', createdAt: isoIn(0, 10, 30) },
  { id: 'pr-2', patientName: 'Mohit Prasad', direction: 'OUTGOING', counterpart: 'Community Health Centre, Patna', reason: 'Endocrine review', status: 'CREATED', createdAt: isoIn(-2, 9, 0) },
  { id: 'pr-3', patientName: 'Pooja Sinha', direction: 'INCOMING', counterpart: 'Gramin Health Sub-Centre', reason: 'Tuberculosis suspect follow-up', status: 'COMPLETED', createdAt: isoIn(-5, 14, 0) },
  { id: 'pr-4', patientName: 'Munna Kumar', direction: 'INCOMING', counterpart: 'Gramin Health Sub-Centre', reason: 'Child immunisation default follow-up', status: 'CREATED', createdAt: isoIn(0, 8, 40) },
  { id: 'pr-5', patientName: 'Ashok Mehta', direction: 'OUTGOING', counterpart: 'District Hospital, Patna', reason: 'Surgical opinion — chronic wound', status: 'COMPLETED', createdAt: isoIn(-6, 11, 0) },
  { id: 'pr-6', patientName: 'Sita Devi', direction: 'OUTGOING', counterpart: 'Community Health Centre, Patna', reason: 'Resistant hypertension — specialist opinion', status: 'ACCEPTED', createdAt: isoIn(-1, 16, 15) },
  { id: 'pr-7', patientName: 'Bhola Sahu', direction: 'OUTGOING', counterpart: 'District Hospital, Patna', reason: 'Chronic wound — surgical review needed', status: 'CREATED', createdAt: isoIn(-5, 10, 15) },
  { id: 'pr-8', patientName: 'Lata Devi', direction: 'OUTGOING', counterpart: 'Community Health Centre, Patna', reason: 'Thyroid function test — endocrine review', status: 'COMPLETED', createdAt: isoIn(-10, 11, 15) },
  { id: 'pr-9', patientName: 'Anjali Devi', direction: 'INCOMING', counterpart: 'Sub-Health Centre, Fatuha', reason: 'Dengue screening results — platelet monitoring', status: 'ACCEPTED', createdAt: isoIn(0, 9, 20) },
];

export const phcMedicines = [
  { name: 'Paracetamol 500 mg', batch: 'PCM-26-01', stock: 1200, lowWatermark: 200, expiry: isoIn(365, 9, 0) },
  { name: 'ORS Sachets', batch: 'ORS-26-11', stock: 45, lowWatermark: 100, expiry: isoIn(240, 9, 0) },
  { name: 'Ferrous Sulphate 100 mg', batch: 'FES-25-08', stock: 60, lowWatermark: 150, expiry: isoIn(90, 9, 0) },
  { name: 'Amoxicillin 250 mg', batch: 'AMX-26-03', stock: 300, lowWatermark: 120, expiry: isoIn(180, 9, 0) },
  { name: 'Cetirizine 10 mg', batch: 'CTZ-26-02', stock: 80, lowWatermark: 100, expiry: isoIn(210, 9, 0) },
  { name: 'Paracetamol Syrup 120ml', batch: 'PCS-26-06', stock: 24, lowWatermark: 30, expiry: isoIn(150, 9, 0) },
  { name: 'Metformin 500 mg', batch: 'MET-26-04', stock: 450, lowWatermark: 150, expiry: isoIn(270, 9, 0) },
  { name: 'Amlodipine 5 mg', batch: 'AML-26-07', stock: 280, lowWatermark: 100, expiry: isoIn(300, 9, 0) },
  { name: 'Omeprazole 20 mg', batch: 'OMP-26-05', stock: 180, lowWatermark: 80, expiry: isoIn(200, 9, 0) },
  { name: 'Betamethasone Cream 30g', batch: 'BET-26-09', stock: 12, lowWatermark: 20, expiry: isoIn(120, 9, 0) },
  { name: 'Ivermectin 6 mg', batch: 'IVR-26-08', stock: 200, lowWatermark: 50, expiry: isoIn(330, 9, 0) },
  { name: 'Diazepam 5 mg', batch: 'DZP-26-10', stock: 60, lowWatermark: 40, expiry: isoIn(180, 9, 0) },
];

export const phcDiagnostics = [
  { id: 'dg-1', patientName: 'Geeta Pal', test: 'Complete Blood Count', status: 'PENDING', orderedAt: isoIn(-2, 9, 15) },
  { id: 'dg-2', patientName: 'Mohit Prasad', test: 'HbA1c', status: 'READY', orderedAt: isoIn(-6, 11, 30) },
  { id: 'dg-3', patientName: 'Ashok Mehta', test: 'Wound Swab Culture', status: 'PENDING', orderedAt: isoIn(0, 8, 10) },
  { id: 'dg-4', patientName: 'Pooja Sinha', test: 'Sputum AFB', status: 'REVIEWED', orderedAt: isoIn(-5, 14, 20) },
  { id: 'dg-5', patientName: 'Sita Devi', test: 'Lipid Profile', status: 'PENDING', orderedAt: isoIn(0, 10, 0) },
  { id: 'dg-6', patientName: 'Raju Manjhi', test: 'Abdominal Ultrasound', status: 'PENDING', orderedAt: isoIn(0, 9, 10) },
  { id: 'dg-7', patientName: 'Poonam Singh', test: 'Haemoglobin Estimation', status: 'READY', orderedAt: isoIn(-2, 9, 35) },
  { id: 'dg-8', patientName: 'Anjali Devi', test: 'Dengue IgM / IgG', status: 'PENDING', orderedAt: isoIn(0, 9, 15) },
];

/* ---------------------------------- admin ---------------------------------- */

export const adminOverview = {
  villages: 126,
  facilities: 42,
  activeUsers: 3108,
  referralsThisMonth: 214,
  avgResponseHours: 6.4,
  satisfactionPct: 91,
};

export const adminAnalytics = [
  { metric: 'Facility coverage', value: 87, unit: '%', changePct: 4 },
  { metric: 'Village outreach visits', value: 1260, unit: '', changePct: 12 },
  { metric: 'Referrals completed', value: 187, unit: '', changePct: 8 },
  { metric: 'Avg referral response', value: 6.4, unit: 'hrs', changePct: -11 },
  { metric: 'Medicine stock alerts', value: 9, unit: '', changePct: -22 },
  { metric: 'Teleconsult adoption', value: 34, unit: '%', changePct: 18 },
  { metric: 'Patient satisfaction', value: 91, unit: '%', changePct: 3 },
  { metric: 'Diagnostics turnaround', value: 2.1, unit: 'days', changePct: -15 },
  { metric: 'ANC registration rate', value: 78, unit: '%', changePct: 9 },
  { metric: 'DOTS completion rate', value: 89, unit: '%', changePct: 5 },
  { metric: 'Immunisation coverage', value: 82, unit: '%', changePct: 7 },
  { metric: 'Emergency response avg', value: 4.2, unit: 'hrs', changePct: -18 },
];

export const adminFacilities = [
  { id: 'fac-1', name: 'Primary Health Centre, Danapur', type: 'PHC', district: 'Patna', doctors: 3, staff: 14, utilizationPct: 86, status: 'ACTIVE' },
  { id: 'fac-2', name: 'Community Health Centre, Patna', type: 'CHC', district: 'Patna', doctors: 8, staff: 36, utilizationPct: 74, status: 'ACTIVE' },
  { id: 'fac-3', name: 'District Hospital, Patna', type: 'District Hospital', district: 'Patna', doctors: 42, staff: 210, utilizationPct: 93, status: 'ATTENTION' },
  { id: 'fac-4', name: 'Gramin Health Sub-Centre', type: 'Rural Health Centre', district: 'Bhojpur', doctors: 1, staff: 4, utilizationPct: 58, status: 'ACTIVE' },
  { id: 'fac-5', name: 'Life Care Hospital', type: 'Multi-speciality', district: 'Patna', doctors: 18, staff: 96, utilizationPct: 81, status: 'ACTIVE' },
  { id: 'fac-6', name: 'Sub-District Hospital, Danapur', type: 'Sub-District Hospital', district: 'Patna', doctors: 12, staff: 64, utilizationPct: 47, status: 'CLOSED' },
  { id: 'fac-7', name: 'Sub-Health Centre, Fatuha', type: 'Rural Health Centre', district: 'Patna', doctors: 1, staff: 3, utilizationPct: 52, status: 'ACTIVE' },
  { id: 'fac-8', name: 'PHC Paliganj', type: 'PHC', district: 'Patna', doctors: 2, staff: 10, utilizationPct: 67, status: 'ACTIVE' },
  { id: 'fac-9', name: 'CHC Bikram', type: 'CHC', district: 'Patna', doctors: 5, staff: 22, utilizationPct: 71, status: 'ACTIVE' },
  { id: 'fac-10', name: 'District Hospital, Bhojpur', type: 'District Hospital', district: 'Bhojpur', doctors: 28, staff: 140, utilizationPct: 88, status: 'ATTENTION' },
];

export const adminReferralCases = [
  { id: 'rc-1', patient: 'Sunita Ram', from: 'PHC Danapur', to: 'District Hospital, Patna', ageDays: 2, status: 'CREATED', escalated: false },
  { id: 'rc-2', patient: 'Geeta Pal', from: 'ASHA Sugut', to: 'CHC Patna', ageDays: 3, status: 'ACCEPTED', escalated: false },
  { id: 'rc-3', patient: 'Mohit Prasad', from: 'PHC Danapur', to: 'District Hospital, Patna', ageDays: 8, status: 'ACCEPTED', escalated: true },
  { id: 'rc-4', patient: 'Pooja Sinha', from: 'Gramin Health Sub-Centre', to: 'CHC Patna', ageDays: 5, status: 'COMPLETED', escalated: false },
  { id: 'rc-5', patient: 'Ashok Mehta', from: 'PHC Danapur', to: 'District Hospital, Patna', ageDays: 1, status: 'CREATED', escalated: true },
  { id: 'rc-6', patient: 'Sita Devi', from: 'ASHA Danapur', to: 'CHC Patna', ageDays: 2, status: 'ACCEPTED', escalated: false },
  { id: 'rc-7', patient: 'Anjali Devi', from: 'ASHA Sugut', to: 'CHC Patna', ageDays: 1, status: 'CREATED', escalated: false },
  { id: 'rc-8', patient: 'Raju Manjhi', from: 'PHC Danapur', to: 'District Hospital, Patna', ageDays: 1, status: 'ACCEPTED', escalated: true },
];

export const adminReports = [
  { id: 'ar-1', title: 'District coverage summary – August 2026', period: 'Aug 2026', kind: 'PDF', generatedAt: isoIn(-2, 9, 0), sizeKb: 412 },
  { id: 'ar-2', title: 'Referral performance dashboard', period: 'Q3 2026', kind: 'PDF', generatedAt: isoIn(-5, 16, 30), sizeKb: 288 },
  { id: 'ar-3', title: 'Village outreach compliance report', period: 'Aug 2026', kind: 'XLSX', generatedAt: isoIn(-7, 10, 15), sizeKb: 156 },
  { id: 'ar-4', title: 'Medicine stock health audit', period: 'Jul 2026', kind: 'CSV', generatedAt: isoIn(-12, 12, 0), sizeKb: 89 },
  { id: 'ar-5', title: 'Monthly medicine consumption report', period: 'Aug 2026', kind: 'PDF', generatedAt: isoIn(-3, 11, 0), sizeKb: 345 },
  { id: 'ar-6', title: 'ASHA worker performance — weekly', period: 'Week 36, 2026', kind: 'XLSX', generatedAt: isoIn(-1, 8, 0), sizeKb: 128 },
  { id: 'ar-7', title: 'Patient satisfaction survey results', period: 'Q3 2026', kind: 'PDF', generatedAt: isoIn(-8, 14, 0), sizeKb: 520 },
  { id: 'ar-8', title: 'Village-wise disease burden heatmap', period: 'Aug 2026', kind: 'CSV', generatedAt: isoIn(-4, 16, 0), sizeKb: 76 },
];

export const adminSettings = [
  { key: 'region_name', label: 'Region name (display)', value: 'Bihar Health Circle', kind: 'TEXT' },
  { key: 'teleconsult_enabled', label: 'Enable teleconsultation', value: 'true', kind: 'BOOL' },
  { key: 'otp_enabled', label: 'Require OTP for doctor login', value: 'true', kind: 'BOOL' },
  { key: 'default_timeout_hours', label: 'Referral response timeout (hours)', value: '24', kind: 'NUMBER' },
  { key: 'medicine_low_alert', label: 'Low-stock alert threshold (%)', value: '20', kind: 'NUMBER' },
  { key: 'emergency_line', label: 'Emergency line', value: '108', kind: 'TEXT' },
  { key: 'asha_visit_interval_days', label: 'ASHA home-visit interval (days)', value: '7', kind: 'NUMBER' },
  { key: 'referral_auto_escalate_days', label: 'Auto-escalate referrals after (days)', value: '3', kind: 'NUMBER' },
  { key: 'language_default', label: 'Default app language', value: 'hi', kind: 'TEXT' },
  { key: 'notifications_enabled', label: 'Push notifications enabled', value: 'true', kind: 'BOOL' },
];

/* ------------------------------- messaging ------------------------------- */

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

export const conversations: ConversationSummary[] = [
  { id: 'conv-1', peerName: 'Dr. Arjun Sharma', peerRole: 'DOCTOR', lastMessage: 'Your fever should settle by day 3. Keep hydrating.', lastAt: isoIn(0, 9, 12), unread: 2, online: true },
  { id: 'conv-2', peerName: 'Dr. Neha Verma', peerRole: 'DOCTOR', lastMessage: 'Please share your latest ECG report before the visit.', lastAt: isoIn(-1, 14, 40), unread: 0, online: false },
  { id: 'conv-3', peerName: 'Sunita Devi (ASHA)', peerRole: 'HEALTH_WORKER', lastMessage: 'I will visit your village tomorrow for the check-up.', lastAt: isoIn(-2, 18, 5), unread: 1, online: true },
  { id: 'conv-4', peerName: 'PHC Danapur Desk', peerRole: 'PHC', lastMessage: 'Token number A-105 is ready — please proceed to counter 2.', lastAt: isoIn(0, 9, 5), unread: 4, online: true },
  { id: 'conv-5', peerName: 'Dr. Manish Gupta', peerRole: 'DOCTOR', lastMessage: 'Your X-ray is normal. No fracture detected.', lastAt: isoIn(-4, 16, 20), unread: 0, online: false },
  { id: 'conv-6', peerName: 'PHC Patna Desk', peerRole: 'PHC', lastMessage: 'Your lab report is ready for collection.', lastAt: isoIn(-1, 10, 30), unread: 1, online: true },
  { id: 'conv-7', peerName: 'Sunita Devi (ASHA)', peerRole: 'HEALTH_WORKER', lastMessage: 'Blood pressure was 130/85 today. Within range.', lastAt: isoIn(0, 11, 15), unread: 0, online: true },
  { id: 'conv-8', peerName: 'Dr. Priya Nair', peerRole: 'DOCTOR', lastMessage: 'Please bring your fasting glucose report on Monday.', lastAt: isoIn(-3, 9, 45), unread: 0, online: false },
];

export const threads: Record<string, ChatMessage[]> = {
  'conv-1': [
    { id: 'm-1', conversationId: 'conv-1', sender: 'me', text: 'Doctor, I still have a mild fever after 2 days.', at: isoIn(-1, 20, 3) },
    { id: 'm-2', conversationId: 'conv-1', sender: 'peer', text: 'That is expected. Take paracetamol only if the fever is high.', at: isoIn(-1, 20, 18) },
    { id: 'm-3', conversationId: 'conv-1', sender: 'me', text: 'Okay. Also my throat is painful when swallowing.', at: isoIn(0, 8, 45) },
    { id: 'm-4', conversationId: 'conv-1', sender: 'peer', text: 'Your fever should settle by day 3. Keep hydrating.', at: isoIn(0, 9, 12) },
    { id: 'm-9', conversationId: 'conv-1', sender: 'me', text: 'Should I continue the cough syrup too?', at: isoIn(0, 9, 30) },
    { id: 'm-10', conversationId: 'conv-1', sender: 'peer', text: 'Yes, complete the full course even if you feel better.', at: isoIn(0, 9, 40) },
  ],
  'conv-2': [
    { id: 'm-5', conversationId: 'conv-2', sender: 'peer', text: 'Good morning. I reviewed the referral summary.', at: isoIn(-1, 11, 0) },
    { id: 'm-6', conversationId: 'conv-2', sender: 'peer', text: 'Please share your latest ECG report before the visit.', at: isoIn(-1, 14, 40) },
  ],
  'conv-3': [
    { id: 'm-7', conversationId: 'conv-3', sender: 'peer', text: 'Namaste, I checked the household register last week.', at: isoIn(-2, 17, 30) },
    { id: 'm-8', conversationId: 'conv-3', sender: 'peer', text: 'I will visit your village tomorrow for the check-up.', at: isoIn(-2, 18, 5) },
  ],
  'conv-4': [
    { id: 'm-11', conversationId: 'conv-4', sender: 'peer', text: 'Good morning! Your registration is complete for today.', at: isoIn(0, 8, 55) },
    { id: 'm-12', conversationId: 'conv-4', sender: 'peer', text: 'You have been assigned token number A-105.', at: isoIn(0, 9, 0) },
    { id: 'm-13', conversationId: 'conv-4', sender: 'peer', text: 'Token number A-105 is ready — please proceed to counter 2.', at: isoIn(0, 9, 5) },
  ],
  'conv-5': [
    { id: 'm-20', conversationId: 'conv-5', sender: 'me', text: 'Doctor, I fell while playing cricket. My ankle is swollen.', at: isoIn(-5, 18, 30) },
    { id: 'm-21', conversationId: 'conv-5', sender: 'peer', text: 'Apply ice immediately and rest. Get an X-ray done.', at: isoIn(-5, 18, 45) },
    { id: 'm-22', conversationId: 'conv-5', sender: 'me', text: 'Done. Here is the X-ray report.', at: isoIn(-4, 15, 0) },
    { id: 'm-23', conversationId: 'conv-5', sender: 'peer', text: 'Your X-ray is normal. No fracture detected.', at: isoIn(-4, 16, 20) },
  ],
  'conv-6': [
    { id: 'm-24', conversationId: 'conv-6', sender: 'peer', text: 'Hello, your blood test from yesterday is now available.', at: isoIn(-1, 10, 0) },
    { id: 'm-25', conversationId: 'conv-6', sender: 'me', text: 'Thank you. When can I pick it up?', at: isoIn(-1, 10, 15) },
    { id: 'm-26', conversationId: 'conv-6', sender: 'peer', text: 'Your lab report is ready for collection.', at: isoIn(-1, 10, 30) },
  ],
  'conv-7': [
    { id: 'm-27', conversationId: 'conv-7', sender: 'peer', text: 'Namaste, I visited your home this morning for the BP check.', at: isoIn(0, 10, 45) },
    { id: 'm-28', conversationId: 'conv-7', sender: 'me', text: 'Yes, thank you. What were the readings?', at: isoIn(0, 11, 0) },
    { id: 'm-29', conversationId: 'conv-7', sender: 'peer', text: 'Blood pressure was 130/85 today. Within range.', at: isoIn(0, 11, 15) },
  ],
  'conv-8': [
    { id: 'm-30', conversationId: 'conv-8', sender: 'peer', text: 'I have reviewed your sugar logs. Numbers are improving.', at: isoIn(-3, 9, 30) },
    { id: 'm-31', conversationId: 'conv-8', sender: 'me', text: 'That is great news. Should I continue the same dose?', at: isoIn(-3, 9, 40) },
    { id: 'm-32', conversationId: 'conv-8', sender: 'peer', text: 'Please bring your fasting glucose report on Monday.', at: isoIn(-3, 9, 45) },
  ],
};

export function appendMessage(conversationId: string, text: string): ChatMessage {
  const message: ChatMessage = {
    id: `m-${Date.now()}`,
    conversationId,
    sender: 'me',
    text,
    at: new Date().toISOString(),
  };
  const thread = threads[conversationId];
  if (thread) thread.push(message);
  else threads[conversationId] = [message];
  const convo = conversations.find((c) => c.id === conversationId);
  if (convo) {
    convo.lastMessage = text;
    convo.lastAt = message.at;
  }
  return message;
}

/* ------------------------------ prescriptions ------------------------------ */

export const prescriptions = [
  {
    id: 'rx-1',
    patientId: 'p-1001',
    patientName: 'Ramesh Kumar',
    doctorName: 'Dr. Arjun Sharma',
    issuedAt: isoIn(-3, 9, 30),
    diagnosis: 'Upper respiratory tract infection (viral)',
    items: [
      { medicine: 'Paracetamol 500 mg', dosage: '1 tablet', duration: '3 days', instructions: 'After food, only if fever is high' },
      { medicine: 'Cetirizine 10 mg', dosage: '1 tablet at night', duration: '5 days' },
      { medicine: 'Warm saline gargle', dosage: '2–3 times a day', duration: '5 days' },
    ],
    followUp: 'Return if fever persists beyond 4 days',
  },
  {
    id: 'rx-2',
    patientId: 'p-1005',
    patientName: 'Geeta Pal',
    doctorName: 'Dr. Arjun Sharma',
    issuedAt: isoIn(-1, 11, 15),
    diagnosis: 'Iron deficiency anaemia',
    items: [
      { medicine: 'Ferrous sulphate 100 mg', dosage: '1 tablet', duration: '3 months', instructions: 'With vitamin C, empty stomach' },
      { medicine: 'Folic acid 5 mg', dosage: '1 tablet daily', duration: '3 months' },
    ],
    followUp: 'Repeat CBC in 8 weeks',
  },
  {
    id: 'rx-3',
    patientId: 'p-1001',
    patientName: 'Ramesh Kumar',
    doctorName: 'Dr. Priya Anand',
    issuedAt: isoIn(-1, 16, 45),
    diagnosis: 'Pre-diabetes follow-up',
    items: [
      { medicine: 'Metformin 500 mg', dosage: '1 tablet after breakfast', duration: '30 days' },
      { medicine: 'Diet & activity counselling', dosage: 'Follow plan', duration: '3 months' },
    ],
    followUp: 'Repeat fasting glucose in 1 month',
  },
  {
    id: 'rx-4',
    patientId: 'p-1003',
    patientName: 'Geeta Pal',
    doctorName: 'Dr. Kavita Rao',
    issuedAt: isoIn(-5, 14, 0),
    diagnosis: 'Viral fever with dehydration',
    items: [
      { medicine: 'ORS sachets', dosage: '1 sachet in 200ml water', duration: '3 days', instructions: 'Drink throughout the day' },
      { medicine: 'Paracetamol 500 mg', dosage: '1 tablet every 6 hours', duration: '3 days', instructions: 'Only if temperature above 100°F' },
      { medicine: 'Zinc 20 mg', dosage: '1 tablet daily', duration: '5 days' },
    ],
    followUp: 'Return if symptoms worsen or persist beyond 3 days',
  },
  {
    id: 'rx-5',
    patientId: 'p-1008',
    patientName: 'Mohit Prasad',
    doctorName: 'Dr. Arjun Sharma',
    issuedAt: isoIn(-8, 10, 30),
    diagnosis: 'Type 2 Diabetes — dose adjustment',
    items: [
      { medicine: 'Metformin 500 mg', dosage: '1 tablet twice daily', duration: '30 days', instructions: 'After meals' },
      { medicine: 'Glimepiride 1 mg', dosage: '1 tablet before breakfast', duration: '30 days' },
      { medicine: 'Vitamin B Complex', dosage: '1 tablet daily', duration: '30 days' },
    ],
    followUp: 'Repeat HbA1c in 3 months',
  },
  {
    id: 'rx-6',
    patientId: 'p-1010',
    patientName: 'Kamla Devi',
    doctorName: 'Dr. Anita Joshi',
    issuedAt: isoIn(-2, 11, 0),
    diagnosis: 'Antenatal care — 28 weeks',
    items: [
      { medicine: 'Iron Folic Acid (IFA)', dosage: '1 tablet daily', duration: 'Until delivery', instructions: 'Empty stomach with water' },
      { medicine: 'Calcium + Vitamin D3', dosage: '1 tablet twice daily', duration: 'Until delivery', instructions: 'After meals' },
      { medicine: 'Albendazole 400 mg', dosage: '1 tablet', duration: 'Single dose', instructions: 'After 12 weeks of pregnancy only' },
    ],
    followUp: 'Next ANC visit in 2 weeks with urine test',
  },
];

export const reports = [
  { id: 'rpt-1', patientId: 'p-1001', patientName: 'Ramesh Kumar', category: 'LAB', title: 'Complete Blood Count', facility: 'District Hospital, Patna', orderedAt: isoIn(-4, 10, 0), status: 'READY', summary: 'Hb 12.4 g/dL, WBC slightly elevated, platelets normal.' },
  { id: 'rpt-2', patientId: 'p-1001', patientName: 'Ramesh Kumar', category: 'IMAGING', title: 'Chest X-Ray (PA view)', facility: 'District Hospital, Patna', orderedAt: isoIn(-15, 12, 0), status: 'REVIEWED', summary: 'No acute infiltrates. Mild cardiomegaly noted.' },
  { id: 'rpt-3', patientId: 'p-1005', patientName: 'Geeta Pal', category: 'LAB', title: 'Haemoglobin & Ferritin', facility: 'Community Health Centre, Patna', orderedAt: isoIn(-2, 9, 0), status: 'PENDING' },
  { id: 'rpt-4', patientId: 'p-1008', patientName: 'Mohit Prasad', category: 'PATHOLOGY', title: 'Urine Routine', facility: 'Primary Health Centre, Danapur', orderedAt: isoIn(-1, 8, 0), status: 'READY', summary: 'Trace protein, no glucose, no ketones.' },
  { id: 'rpt-5', patientId: 'p-1001', patientName: 'Ramesh Kumar', category: 'SCREENING', title: 'Diabetes Screening (Fasting)', facility: 'Primary Health Centre, Danapur', orderedAt: isoIn(-30, 9, 30), status: 'REVIEWED', summary: 'Fasting glucose 108 mg/dL — pre-diabetes range, dietary guidance given.' },
  { id: 'rpt-6', patientId: 'p-1008', patientName: 'Mohit Prasad', category: 'IMAGING', title: 'Ankle X-Ray (R)', facility: 'District Hospital, Patna', orderedAt: isoIn(-6, 15, 0), status: 'READY', summary: 'No fracture line noted. Soft tissue thickening around lateral malleolus.' },
  { id: 'rpt-7', patientId: 'p-1001', patientName: 'Ramesh Kumar', category: 'LAB', title: 'Lipid Profile', facility: 'District Hospital, Patna', orderedAt: isoIn(-10, 9, 0), status: 'REVIEWED', summary: 'Total cholesterol 210 mg/dL, LDL elevated. Dietary changes recommended.' },
  { id: 'rpt-8', patientId: 'p-1005', patientName: 'Geeta Pal', category: 'LAB', title: 'Iron Studies', facility: 'Community Health Centre, Patna', orderedAt: isoIn(-3, 10, 0), status: 'READY', summary: 'Serum ferritin 8 ng/mL — severely low. CBC shows microcytic anaemia.' },
  { id: 'rpt-9', patientId: 'p-1008', patientName: 'Mohit Prasad', category: 'LAB', title: 'HbA1c', facility: 'Primary Health Centre, Danapur', orderedAt: isoIn(-7, 8, 30), status: 'REVIEWED', summary: 'HbA1c 7.8% — above target. Medication adjustment advised.' },
  { id: 'rpt-10', patientId: 'p-1001', patientName: 'Ramesh Kumar', category: 'IMAGING', title: 'ECG — 12 Lead', facility: 'District Hospital, Patna', orderedAt: isoIn(-5, 14, 0), status: 'REVIEWED', summary: 'Normal sinus rhythm. No ST-T changes. Rate 78 bpm.' },
  { id: 'rpt-11', patientId: 'p-1012', patientName: 'Anjali Devi', category: 'PATHOLOGY', title: 'Dengue NS1 Antigen', facility: 'Community Health Centre, Patna', orderedAt: isoIn(-1, 9, 0), status: 'PENDING', summary: '' },
  { id: 'rpt-12', patientId: 'p-1010', patientName: 'Kamla Devi', category: 'SCREENING', title: 'ANC Blood Group & Hb', facility: 'Primary Health Centre, Danapur', orderedAt: isoIn(-14, 10, 0), status: 'REVIEWED', summary: 'Blood group B+, Hb 10.8 g/dL — mild anaemia, IFA supplements started.' },
];

export const consultations = [
  { id: 'tc-1', appointmentId: 'mock-appt-2', doctorName: 'Dr. Neha Verma', scheduledAt: isoIn(3, 16, 0), mode: 'VIDEO', status: 'UPCOMING', roomHint: 'swasthya-room-4821' },
  { id: 'tc-2', appointmentId: 'mock-appt-1', doctorName: 'Dr. Arjun Sharma', scheduledAt: isoIn(0, 10, 30), mode: 'VIDEO', status: 'ACTIVE', roomHint: 'swasthya-room-1288' },
  { id: 'tc-3', appointmentId: 'mock-appt-3', doctorName: 'Dr. Neha Verma', scheduledAt: isoIn(-5, 17, 0), mode: 'AUDIO', status: 'COMPLETED', roomHint: 'swasthya-room-7760' },
  { id: 'tc-4', appointmentId: 'mock-appt-9', doctorName: 'Dr. Rajiv Menon', scheduledAt: isoIn(4, 17, 0), mode: 'VIDEO', status: 'UPCOMING', roomHint: 'swasthya-room-3345' },
  { id: 'tc-5', appointmentId: 'mock-appt-7', doctorName: 'Dr. Priya Nair', scheduledAt: isoIn(-20, 9, 30), mode: 'VIDEO', status: 'COMPLETED', roomHint: '' },
  { id: 'tc-6', appointmentId: 'mock-appt-4', doctorName: 'Dr. Kavita Rao', scheduledAt: isoIn(0, 11, 0), mode: 'AUDIO', status: 'ACTIVE', roomHint: 'swasthya-room-6677' },
];