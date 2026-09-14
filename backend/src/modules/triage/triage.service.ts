import { TriageAssessment } from '../../database/models/TriageAssessment';
import { PatientProfile } from '../../database/models/PatientProfile';
import { callAIChat } from '../../integrations/ai/ai.client';
import { newTriageId } from '../../utils/id';
import { NotFoundError } from '../../utils/errors';

export interface TriageResult {
  triageId: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT' | 'UNKNOWN';
  possibleConditions: string[];
  missingInformation: string[];
  recommendedAction: string;
  modelVersion: string;
  source: 'AI' | 'MANUAL_FALLBACK';
}

function buildTriagePrompt(input: { symptoms: string; duration?: string; ageGroup: string; context?: string }) {
  return [
    'You are an AI-assisted symptom triage assistant for a primary-care app.',
    'Analyse the following and reply in this exact JSON only, no prose, no markdown:',
    '{"riskLevel":"LOW|MODERATE|HIGH|URGENT","possibleConditions":["..."],"missingInformation":["..."],"recommendedAction":"..."}',
    `Age group: ${input.ageGroup}`,
    `Duration: ${input.duration || 'unspecified'}`,
    input.context ? `Context: ${input.context}` : '',
    `Symptoms: ${input.symptoms}`,
    'Note: The output must make clear this is not a definitive medical diagnosis.',
  ]
    .filter(Boolean)
    .join('\n');
}

function parseJsonReply(reply: string): Partial<TriageResult> {
  try {
    const start = reply.indexOf('{');
    const end = reply.lastIndexOf('}');
    if (start === -1 || end === -1) return {};
    const obj = JSON.parse(reply.slice(start, end + 1)) as Record<string, unknown>;
    return {
      riskLevel: ['LOW', 'MODERATE', 'HIGH', 'URGENT', 'UNKNOWN'].includes(String(obj.riskLevel))
        ? (obj.riskLevel as TriageResult['riskLevel'])
        : 'UNKNOWN',
      possibleConditions: Array.isArray(obj.possibleConditions) ? obj.possibleConditions.map(String) : [],
      missingInformation: Array.isArray(obj.missingInformation) ? obj.missingInformation.map(String) : [],
      recommendedAction: typeof obj.recommendedAction === 'string' ? obj.recommendedAction : '',
    };
  } catch {
    return {};
  }
}

export async function assessTriage(input: {
  patientId: string;
  actorUserId: string;
  symptoms: string;
  duration?: string;
  ageGroup: string;
  language: string;
  context?: string;
  requestId?: string;
  ip?: string;
}): Promise<TriageResult> {
  const prompt = buildTriagePrompt(input);
  // We do not retain raw symptom text. We pass it transiently to the AI.
  const aiResult = await callAIChat({ message: prompt, role: 'patient', language: input.language, sessionId: `triage-${input.actorUserId}` });

  const parsed = parseJsonReply(aiResult.reply);
  const riskLevel: TriageResult['riskLevel'] = aiResult.emergency
    ? 'URGENT'
    : parsed.riskLevel || 'UNKNOWN';
  const possibleConditions = aiResult.emergency
    ? ['Red-flag symptoms detected']
    : parsed.possibleConditions || [];
  const source: 'AI' | 'MANUAL_FALLBACK' = aiResult.emergency ? 'MANUAL_FALLBACK' : parsed.recommendedAction ? 'AI' : 'MANUAL_FALLBACK';

  const triageId = newTriageId();
  const assessment = await TriageAssessment.create({
    triageId,
    patientId: input.patientId,
    language: input.language,
    ageGroup: input.ageGroup,
    riskLevel,
    possibleConditions,
    missingInformation: parsed.missingInformation || [],
    recommendedAction:
      parsed.recommendedAction ||
      (aiResult.emergency
        ? 'Seek emergency care immediately (call 108).'
        : 'Please consult a healthcare professional.'),
    modelVersion: 'swasthya-triage-1.0',
    source,
    disclaimer: 'AI-assisted symptom assessment. This is not a definitive medical diagnosis.',
    rawSymptomsStored: false,
  });

  return {
    triageId: assessment.triageId,
    riskLevel: assessment.riskLevel as TriageResult['riskLevel'],
    possibleConditions: assessment.possibleConditions,
    missingInformation: assessment.missingInformation,
    recommendedAction: assessment.recommendedAction || '',
    modelVersion: assessment.modelVersion || 'swasthya-triage-1.0',
    source,
  };
}

export async function getTriageForPatient(triageId: string, internalUserId: string) {
  const patient = await PatientProfile.findOne({ internalUserId }).lean();
  if (!patient) throw new NotFoundError('Patient profile not found');
  const assessment = await TriageAssessment.findOne({ triageId, patientId: patient.patientId }).lean();
  if (!assessment) throw new NotFoundError('Triage assessment not found');
  return assessment;
}
