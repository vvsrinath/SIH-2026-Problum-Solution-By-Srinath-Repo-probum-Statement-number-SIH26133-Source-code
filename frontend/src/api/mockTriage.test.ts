import { describe, expect, it } from 'vitest';
import { runMockTriage, mockChatReply } from '../api/mockTriage';
import { signMockJwt, verifyMockJwt } from '../api/mockAuth';

describe('mockTriage — offline symptom diagnosis', () => {
  it('flags urgent red-flag symptoms', () => {
    const result = runMockTriage({ symptoms: 'chest pain and difficulty breathing', duration: 'since morning' });
    expect(result.riskLevel).toBe('URGENT');
    expect(result.possibleConditions).toContain('Possible serious condition requiring urgent evaluation');
    expect(result.recommendedAction).toContain('108');
    expect(result.source).toBe('MANUAL_FALLBACK');
  });

  it('returns moderate risk for common fever/cough', () => {
    const result = runMockTriage({ symptoms: 'fever and cough with sore throat', ageGroup: 'ADULT' });
    expect(result.riskLevel).toBe('MODERATE');
    expect(result.possibleConditions.length).toBeGreaterThan(0);
  });

  it('returns low risk for a common cold', () => {
    const result = runMockTriage({ symptoms: 'mild cold, runny nose and tiredness' });
    expect(result.riskLevel).toBe('LOW');
  });

  it('never claims a definitive diagnosis and keeps an id', () => {
    const result = runMockTriage({ symptoms: 'random nonsense text here' });
    expect(result.triageId).toBeTruthy();
    expect(result.riskLevel).toBe('UNKNOWN');
    expect(result.disclaimer).toBeTruthy();
  });
});

describe('mockTriage — offline chat', () => {
  it('replies with symptom advice', () => {
    const reply = mockChatReply('I have a headache and fever');
    expect(reply.agent).toBe('Medical Advisor');
    expect(reply.text).toContain('Fever');
  });

  it('flags emergency keywords', () => {
    const reply = mockChatReply('I have chest pain and difficulty breathing');
    expect(reply.emergency).toBe(true);
  });

  it('routes app questions to the care navigator', () => {
    const reply = mockChatReply('How do I book an appointment?');
    expect(reply.agent).toBe('Care Navigator');
  });
});

describe('mockAuth — offline JWT session', () => {
  it('signs and verifies a mock HS256 JWT with the backend payload shape', async () => {
    const jwt = await signMockJwt({ sub: 'user-patient-1', role: 'PATIENT', type: 'access', sessionId: 'sess-1' });
    expect(jwt.split('.')).toHaveLength(3);
    const payload = verifyMockJwt(jwt);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-patient-1');
    expect(payload?.role).toBe('PATIENT');
    expect(payload?.type).toBe('access');
    expect(payload?.iss).toBe('swasthya-sathi-backend');
    expect(payload?.aud).toBe('swasthya-sathi-pwa');
  });

  it('rejects tampered or expired tokens', async () => {
    const jwt = await signMockJwt({ sub: 'user-patient-1', role: 'PATIENT', type: 'access', sessionId: 'sess-1' });
    const [h, b] = jwt.split('.');
    expect(verifyMockJwt(`${h}.b${b.slice(1)}.tampered`)).toBeNull();
  });
});