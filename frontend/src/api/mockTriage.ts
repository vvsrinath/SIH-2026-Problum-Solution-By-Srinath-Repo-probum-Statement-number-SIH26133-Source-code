import type { TriageAssessment, TriageRisk } from '../types';

/**
 * Client-side rule-based symptom triage engine (offline / mock fallback).
 *
 * Direct TypeScript port of the backend Python engine (engine.py) so the
 * symptom diagnosis feature works end-to-end even when the FastAPI /
 * MongoDB backend is not running. It follows the same transparent pipeline:
 * symptom matching -> risk rules -> red-flag safety override -> care tip.
 * It never claims a definitive diagnosis.
 */

const SYMPTOM_KEYWORDS: string[] = [
  'fever',
  'cough',
  'cold',
  'headache',
  'migraine',
  'stomach',
  'pain',
  'vomit',
  'nausea',
  'diarrhea',
  'rash',
  'itch',
  'fatigue',
  'tired',
  'sore throat',
  'runny nose',
  'body ache',
  'chills',
  'dizzy',
  'chest pain',
  'breathless',
  'swelling',
  'bleeding',
  'burn',
  'joint pain',
  'back pain',
  'tooth',
  'ear ache',
  'eye',
  'anxiety',
  'stress',
  'insomnia',
  'sleep',
  'appetite',
];

const RED_FLAG_KEYWORDS: string[] = [
  'chest pain',
  'difficulty breathing',
  'breathless',
  'short of breath',
  'unconscious',
  'passing out',
  'fainting',
  'seizure',
  'stiff neck',
  'uncontrolled bleeding',
  'coughing blood',
  'blood in stool',
  'high fever',
  'very high',
  '103',
  '104',
];

const HIGH_RISK_KEYWORDS: string[] = [
  'persistent vomiting',
  'bloody',
  'severe headache',
  'dehydration',
  'difficulty swallowing',
  'swollen',
  'rash',
  'severe pain',
];

const MODERATE_KEYWORDS: string[] = [
  'fever',
  'cough',
  'diarrhea',
  'diarrhoea',
  'vomiting',
  'vomit',
  'nausea',
  'sore throat',
  'body ache',
  'chills',
  'dizzy',
  'headache',
  'stomach',
  'stomach pain',
];

const LOW_KEYWORDS: string[] = [
  'cold',
  'runny nose',
  'fatigue',
  'tired',
  'mild',
  'sneezing',
  'sleep',
  'insomnia',
];

const CONDITION_GROUPS: [Set<string>, string[]][] = [
  [new Set(['chest pain', 'difficulty breathing', 'breathless', 'short of breath']), ['Possible cardiac or respiratory condition requiring urgent evaluation']],
  [new Set(['fever', 'cough', 'sore throat', 'runny nose', 'cold']), ['Upper respiratory tract infection (common cold / flu-like illness)']],
  [new Set(['fever', 'cough']), ['Viral fever', 'Upper respiratory tract infection']],
  [new Set(['stomach', 'stomach pain', 'vomit', 'vomiting', 'nausea', 'diarrhea', 'diarrhoea']), ['Acute gastroenteritis / food-related illness']],
  [new Set(['headache', 'dizzy', 'severe headache']), ['Tension-type headache / migraine']],
  [new Set(['dizzy', 'tired', 'fatigue', 'sleep', 'insomnia']), ['Fatigue / possible low blood pressure or anaemia']],
  [new Set(['fever', 'rash']), ['Viral illness with rash']],
  [new Set(['joint pain', 'back pain', 'swelling']), ['Musculoskeletal pain']],
];

function extractSymptoms(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const keyword of SYMPTOM_KEYWORDS) {
    if (lower.includes(keyword)) found.push(keyword);
  }
  return found;
}

function conditionsFor(symptoms: string[]): string[] {
  if (!symptoms || symptoms.length === 0) return [];
  const scored: [number, string[]][] = [];
  for (const [group, labels] of CONDITION_GROUPS) {
    if (symptoms.some((s) => group.has(s))) {
      const score = symptoms.reduce((acc, s) => acc + (group.has(s) ? 1 : 0), 0);
      scored.push([score, labels]);
    }
  }
  if (scored.length === 0) return ['Unspecified illness — professional evaluation advised'];
  const best = Math.max(...scored.map(([s]) => s));
  const merged: string[] = [];
  for (const [score, labels] of scored) {
    if (score === best) {
      for (const label of labels) {
        if (!merged.includes(label)) merged.push(label);
      }
    }
  }
  return merged.slice(0, 2);
}

function missingInformation(text: string, _symptoms: string[]): string[] {
  const lower = text.toLowerCase();
  const missing: string[] = [];
  const durationTerms = ['since', 'days', 'weeks', 'months', 'duration'];
  if (!durationTerms.some((t) => lower.includes(t))) missing.push('Duration of symptoms');
  if (!['mild', 'moderate', 'severe'].some((t) => lower.includes(t))) {
    missing.push('Severity (mild / moderate / severe)');
  }
  if (!['breath', 'breathing', 'chest'].some((t) => lower.includes(t))) {
    missing.push('Presence of red-flag symptoms (breathing difficulty, chest pain)');
  }
  if (!lower.includes('medicine') && !lower.includes('medication')) {
    missing.push('Ongoing medicines or chronic conditions');
  }
  return missing.slice(0, 3);
}

export interface MockTriageInput {
  symptoms: string;
  duration?: string;
  ageGroup?: string;
  context?: string;
}

/** Deterministic, offline rule-based symptom assessment. */
export function runMockTriage(input: MockTriageInput): TriageAssessment {
  const text = `${input.symptoms} ${input.duration ?? ''} ${input.ageGroup ?? ''} ${input.context ?? ''}`.toLowerCase();
  const symptoms = extractSymptoms(text);

  const redFlags = RED_FLAG_KEYWORDS.filter((k) => text.includes(k));
  const highHits = HIGH_RISK_KEYWORDS.filter((k) => text.includes(k));
  const moderateHits = MODERATE_KEYWORDS.filter((k) => text.includes(k));
  const lowHits = LOW_KEYWORDS.filter((k) => text.includes(k));

  let risk: TriageRisk;
  let conditions: string[];
  let recommended: string;

  if (redFlags.length > 0) {
    risk = 'URGENT';
    conditions = ['Possible serious condition requiring urgent evaluation'];
    recommended = 'Seek emergency care immediately (call 108).';
  } else if (highHits.length > 0) {
    risk = 'HIGH';
    conditions = conditionsFor(symptoms);
    recommended = 'Consult a doctor as soon as possible — within 24 hours.';
  } else if (moderateHits.length > 0) {
    risk = 'MODERATE';
    conditions = conditionsFor(symptoms);
    recommended = 'Book a consultation with a primary-care doctor in the next day or two.';
  } else if (lowHits.length > 0) {
    risk = 'LOW';
    conditions = conditionsFor(symptoms);
    recommended = 'Home care and monitoring; see a doctor if symptoms worsen.';
  } else {
    risk = 'UNKNOWN';
    conditions = [];
    recommended = 'Please consult a healthcare professional.';
  }

  return {
    triageId: `mock-${Date.now().toString(36)}`,
    riskLevel: risk,
    possibleConditions: conditions,
    missingInformation: missingInformation(text, symptoms),
    recommendedAction: recommended,
    modelVersion: 'local-rule-engine-1',
    source: 'MANUAL_FALLBACK',
    disclaimer:
      'This is an offline rule-based assessment for demonstration purposes and is not a medical diagnosis.',
  };
}

/* ------------------------------------------------------------------ */
/*  Mock chat responder (offline Swasthya Mitra)                        */
/* ------------------------------------------------------------------ */

interface MockChatReply {
  text: string;
  agent: string;
  emergency: boolean;
}

function classifyIntent(message: string): 'symptom' | 'app' | 'translate' | 'general' {
  const lower = message.toLowerCase();
  const translateKw = ['translate', 'translation', 'say in', 'how do i say', 'meaning in', 'write in', 'convert to'];
  const appKw = [
    'appointment', 'book', 'schedule', 'cancel appointment', 'record', 'health record',
    'history', 'prescription', 'referral', 'follow up', 'follow-up', 'hospital', 'clinic',
    'phc', 'health center', 'map', 'find doctor', 'search doctor', 'specialist', 'login',
    'register', 'sign up', 'password', 'profile', 'notification', 'settings', 'language',
    'अपॉइंटमेंट', 'बुकिंग', 'रिकॉर्ड', 'अस्पताल', 'डॉक्टर',
  ];
  const symptomKw = ['fever', 'cough', 'cold', 'headache', 'stomach', 'pain', 'vomit', 'nausea', 'diarrhea', 'rash', 'fatigue', 'tired', 'chills', 'dizzy', 'chest pain', 'breathless'];
  if (translateKw.some((k) => lower.includes(k))) return 'translate';
  if (appKw.some((k) => lower.includes(k))) return 'app';
  if (symptomKw.some((k) => lower.includes(k))) return 'symptom';
  return 'general';
}

const SYMPTOM_ADVICE: Record<string, string> = {
  fever:
    '**Fever** can be caused by many things — infection, heat, or inflammation.\n\n' +
    '- Rest and drink plenty of fluids (ORS, warm water).\n' +
    '- Paracetamol (500 mg) may help reduce fever — follow packet dosage.\n' +
    '- Use a cold compress on the forehead.\n\n' +
    '**See a doctor if:** fever lasts > 3 days, is above 103°F (39.4°C), or is accompanied by stiff neck, rash, or difficulty breathing.\n\nCall 108 in an emergency.',
  cough:
    '**Cough** can be viral, allergic, or due to dust/irritants.\n\n- Drink warm water, honey-lemon tea, or ginger water.\n- Avoid cold drinks and dusty environments.\n- Steam inhalation may help relieve congestion.\n\n**See a doctor if:** cough lasts > 2 weeks, produces blood, or is accompanied by high fever or chest pain.',
  headache:
    '**Headache** is common and usually not serious.\n\n- Rest in a quiet, dark room.\n- Apply a cold or warm compress to your forehead or neck.\n- Stay hydrated — drink water or ORS.\n- Paracetamol (500 mg) can help — follow dosage.\n\n**See a doctor if:** sudden severe headache, headache with fever and stiff neck, or headache after an injury.',
  stomach:
    '**Stomach pain** can have many causes — gas, indigestion, infection, or more.\n\n- Drink warm water; avoid spicy/fried food.\n- Light meals (rice, curd, banana) are best.\n- ORS if there is diarrhea or vomiting.\n\n**See a doctor if:** pain is severe, lasts > 2 days, blood in stool, or accompanied by high fever.',
  cold: '**Common cold** is usually viral and resolves in 5–7 days.\n\n- Rest, drink warm fluids, and stay warm.\n- Steam inhalation and salt-water gargle help with congestion.\n- Avoid antibiotics unless prescribed by a doctor.\n\n**See a doctor if:** symptoms worsen after 5 days, high fever, or breathing difficulty.',
};

const DEFAULT_SYMPTOM_RESPONSE =
  "I understand you're not feeling well. Here's some general care guidance:\n\n- **Rest** and drink plenty of fluids (water, ORS, warm soups).\n- **Monitor** your temperature and symptoms.\n- **Light meals** — avoid spicy or heavy food.\n\n**See a doctor if:** symptoms are severe, persist for more than 2–3 days, or you experience high fever, difficulty breathing, or chest pain.\n\nCall **108** in an emergency. For a proper diagnosis, please visit your nearest doctor or health centre.";

const APP_CARE_RESPONSE =
  "I can help you navigate **Swasthya Sathi**! Here's what the app offers:\n\n**For Patients:**\n- Find hospitals/PHCs on the map\n- Book and manage appointments\n- View health records and prescriptions\n- Get referrals and follow-up reminders\n- Online consultation with doctors\n\n**For Doctors:**\n- Manage appointments and availability\n- View patient records (with consent)\n- Create referrals and follow-ups\n\n**For Health Workers:**\n- Field triage and home visits\n- Manage assigned patients\n\nWhat would you like help with?";

const GREETING_RESPONSE =
  "Namaste! I'm **Swasthya Mitra**, your health guide on Swasthya Sathi.\n\nI can help you with:\n- **Health questions** — describe symptoms and I'll share general care guidance\n- **App help** — how to use appointments, records, referrals, and more\n- **Translation** — convert text between Indian languages\n\nWhat would you like help with today?";

const TRANSLATE_RESPONSE =
  "I'd love to help with translation! For accurate medical translations across 12 Indian languages, our full translation service is being set up. In the meantime, try asking about symptoms or app features.";

function findMatchingSymptom(message: string): string | null {
  const lower = message.toLowerCase();
  for (const key of Object.keys(SYMPTOM_ADVICE)) {
    if (lower.includes(key)) return key;
  }
  return null;
}

export function mockChatReply(message: string): MockChatReply {
  const intent = classifyIntent(message);
  const emergency = RED_FLAG_KEYWORDS.some((k) => message.toLowerCase().includes(k));

  if (intent === 'translate') return { text: TRANSLATE_RESPONSE, agent: 'Wording', emergency };
  if (intent === 'app') return { text: APP_CARE_RESPONSE, agent: 'Care Navigator', emergency };

  if (intent === 'symptom') {
    const matched = findMatchingSymptom(message);
    if (matched) return { text: SYMPTOM_ADVICE[matched], agent: 'Medical Advisor', emergency };
    return { text: DEFAULT_SYMPTOM_RESPONSE, agent: 'Medical Advisor', emergency };
  }

  if (/hello|hi|hey|namaste|नमस्ते|வணக்கம்/.test(message.toLowerCase())) {
    return { text: GREETING_RESPONSE, agent: 'Health Guide', emergency: false };
  }

  return {
    text:
      "I'm **Swasthya Mitra**, here to help with health questions, app guidance, and translations. Could you tell me more about what you need?\n\nYou can ask about symptoms, how to use the app, or request a translation.",
    agent: 'Health Guide',
    emergency: false,
  };
}
