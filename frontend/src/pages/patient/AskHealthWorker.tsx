import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronRightIcon,
  HeartPulseIcon,
  PhoneIcon,
  RotateCcwIcon,
  SendIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { assessTriage, TRIAGE_LABEL } from '../../api/services';
import { streamChat, createSessionId, API_BASE_URL } from '../../api/backend';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import type { TriageAssessment, TriageRisk } from '../../types';

/* ------------------------------------------------------------------ */
/*  Multi-step symptom assessment form                                 */
/* ------------------------------------------------------------------ */

type Step = 'symptoms' | 'duration' | 'age' | 'context' | 'review';

interface FormData {
  symptoms: string;
  duration: string;
  ageGroup: 'ADULT' | 'CHILD' | 'INFANT' | 'UNSPECIFIED';
  context: string;
}

const AGE_OPTIONS: { value: FormData['ageGroup']; label: string }[] = [
  { value: 'ADULT', label: 'Adult (18+)' },
  { value: 'CHILD', label: 'Child (2–17)' },
  { value: 'INFANT', label: 'Infant (0–1)' },
  { value: 'UNSPECIFIED', label: 'Prefer not to say' },
];

const STEP_LABELS: Record<Step, string> = {
  symptoms: 'Describe your symptoms',
  duration: 'How long?',
  age: 'Age group',
  context: 'Extra context',
  review: 'Review & assess',
};

const STEP_ORDER: Step[] = ['symptoms', 'duration', 'age', 'context', 'review'];

/* ------------------------------------------------------------------ */
/*  Risk badge                                                         */
/* ------------------------------------------------------------------ */

const RISK_COLORS: Record<TriageRisk, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MODERATE: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200',
  UNKNOWN: 'bg-gray-50 text-gray-600 border-gray-200',
};

/* ------------------------------------------------------------------ */
/*  Chat message type (reuses ChatPanel visual language)                */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  emergency?: boolean;
}

function sourceLabel(source: string): string {
  return source === 'AI' ? 'Care guidelines' : 'Offline guidance';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AskHealthWorker() {
  /* ---- assessment state ---- */
  const [step, setStep] = useState<Step>('symptoms');
  const [form, setForm] = useState<FormData>({
    symptoms: '',
    duration: '',
    ageGroup: 'UNSPECIFIED',
    context: '',
  });
  const [triageResult, setTriageResult] = useState<TriageAssessment | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState<Error | null>(null);

  /* ---- conversational chat state ---- */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<null | boolean>(null);
  const sessionIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);

  /* ---- health check ---- */
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/health`, { credentials: 'include' })
      .then((r) => r.json())
      .then((body) => {
        const data = body.data ?? body;
        if (!cancelled) setReady(data.status === 'ok');
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- helpers ---- */
  const currentStepIndex = STEP_ORDER.indexOf(step);

  function canProceed(): boolean {
    if (step === 'symptoms') return form.symptoms.trim().length >= 2;
    return true;
  }

  function nextStep() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  }

  function prevStep() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  const runTriage = useCallback(async () => {
    setTriageLoading(true);
    setTriageError(null);
    try {
      const result = await assessTriage({
        symptoms: form.symptoms,
        duration: form.duration || undefined,
        ageGroup: form.ageGroup,
        context: form.context || undefined,
      });
      setTriageResult(result);
    } catch (err) {
      setTriageError(err instanceof Error ? err : new Error('Assessment request failed'));
    } finally {
      setTriageLoading(false);
    }
  }, [form]);

  function resetAll() {
    setStep('symptoms');
    setForm({ symptoms: '', duration: '', ageGroup: 'UNSPECIFIED', context: '' });
    setTriageResult(null);
    setTriageError(null);
    setShowChat(false);
    setMessages([]);
  }

  /* ---- chat helpers ---- */
  async function sendMessage() {
    const text = input.trim();
    if (!text || busy) return;

    const sessionId = sessionIdRef.current ?? createSessionId();
    sessionIdRef.current = sessionId;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setBusy(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    let emergency = false;
    try {
      await streamChat({
        sessionId,
        message: text,
        lang: 'auto',
        role: 'patient',
        features: ['appointments', 'records', 'referrals', 'medicines', 'find-healthcare'],
        onMeta: (meta) => {
          emergency = meta.emergency;
        },
        onDelta: (chunk) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = {
                ...last,
                content: last.content + chunk,
                emergency: emergency || last.emergency,
              };
            }
            return next;
          });
        },
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'assistant' && !last.content) {
          next[next.length - 1] = { ...last, content: 'Sorry, something went wrong. Please try again.' };
        }
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  const isUrgent = triageResult?.riskLevel === 'URGENT';

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-white shadow-card h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-6.5rem)]">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between gap-2 border-b border-line bg-brand-tint px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-brand text-white">
            <HeartPulseIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-navy">Symptom Guidance</p>
            <p className="truncate text-2xs text-ink-500">Swasthya Mitra · your care team</p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetAll}
          aria-label="Start over"
          title="Start over"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-ink-500 transition-colors duration-150 ease-out hover:bg-brand-tint2 hover:text-brand"
        >
          <RotateCcwIcon className="h-4 w-4" />
        </button>
      </div>

      {/* ---- Backend offline banner ---- */}
      {ready === false && (
        <p className="border-b border-warn-tint bg-warn-tint px-3 py-1.5 text-2xs text-warn">
          Demo mode — using offline care guidance.
        </p>
      )}

      {/* ---- Body ---- */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 sm:px-4">

        {/* ---- RESULT VIEW ---- */}
        {triageResult && (
          <div className="space-y-3">
            {/* URGENT banner */}
            {isUrgent && (
              <div className="flex items-start gap-3 rounded-card border border-red-200 bg-red-50 p-4">
                <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-bold text-red-700">Emergency — Call 108 immediately</p>
                  <p className="mt-1 text-xs text-red-600">
                    Your symptoms indicate a potentially serious condition. Please call emergency
                    services (108) or go to the nearest emergency room right away.
                  </p>
                </div>
              </div>
            )}

            {/* Risk badge */}
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                  RISK_COLORS[triageResult.riskLevel],
                )}
              >
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                {TRIAGE_LABEL[triageResult.riskLevel]}
              </span>
              <span className="text-2xs text-ink-400">
                {sourceLabel(triageResult.source)} &middot; v{triageResult.modelVersion}
              </span>
            </div>

            {/* Conditions to discuss */}
            {triageResult.possibleConditions.length > 0 && (
              <div className="rounded-card border border-line bg-line-soft p-3">
                <p className="mb-1.5 text-xs font-semibold text-navy">Conditions to discuss with a doctor</p>
                <ul className="space-y-1">
                  {triageResult.possibleConditions.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-xs text-ink-600">
                      <ChevronRightIcon className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing information */}
            {triageResult.missingInformation.length > 0 && (
              <div className="rounded-card border border-amber-200 bg-amber-50 p-3">
                <p className="mb-1.5 text-xs font-semibold text-amber-800">
                  Missing information to share with your doctor
                </p>
                <ul className="space-y-1">
                  {triageResult.missingInformation.map((m) => (
                    <li key={m} className="flex items-start gap-2 text-xs text-amber-700">
                      <AlertTriangleIcon className="mt-0.5 h-3 w-3 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended action */}
            {triageResult.recommendedAction && (
              <div className="rounded-card border border-line bg-white p-3">
                <p className="mb-1 text-xs font-semibold text-navy">What we suggest</p>
                <p className="text-xs leading-5 text-ink-600">
                  {triageResult.recommendedAction}
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <p className="rounded-card bg-gray-50 px-3 py-2 text-2xs leading-4 text-ink-400">
              This guidance is informational and is not a medical diagnosis. Please have a qualified
              doctor or health worker review your condition for a proper diagnosis.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-white px-3 py-1.5 text-2xs font-medium text-ink-600 transition-colors hover:border-brand/30 hover:text-brand"
              >
                <RotateCcwIcon className="h-3 w-3" />
                Start over
              </button>
              <button
                type="button"
                onClick={() => setShowChat(true)}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-brand px-3 py-1.5 text-2xs font-medium text-white transition-colors hover:bg-brand-dark"
              >
                <HeartPulseIcon className="h-3 w-3" />
                Ask the care team
              </button>
            </div>
          </div>
        )}

        {/* ---- LOADING ---- */}
        {triageLoading && !triageResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:300ms]" />
              <span>Reviewing your symptoms&hellip;</span>
            </div>
            <LoadingState rows={2} label="Running care assessment" />
          </div>
        )}

        {/* ---- ERROR ---- */}
        {triageError && !triageLoading && (
          <ErrorState
            title="Assessment failed"
            detail={triageError.message}
            onRetry={runTriage}
          />
        )}

        {/* ---- CHAT FOLLOW-UP ---- */}
        {showChat && triageResult && (
          <div className="space-y-3">
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-xs font-semibold text-navy">Follow-up conversation</p>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'mb-2 max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 text-xs leading-5',
                    msg.role === 'user'
                      ? 'ml-auto bg-brand text-white'
                      : msg.emergency
                        ? 'border border-warn-tint bg-warn-tint text-navy'
                        : 'border border-line bg-line-soft text-navy',
                  )}
                >
                  {msg.content || (
                    <span className="flex items-center gap-1 text-ink-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- EMPTY / FORM ---- */}
        {!triageResult && !triageLoading && !triageError && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            {/* Step indicator */}
            <div className="mb-2 flex items-center gap-1">
              {STEP_ORDER.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i <= currentStepIndex ? 'w-5 bg-brand' : 'w-1.5 bg-line',
                  )}
                />
              ))}
            </div>

            <span className="flex h-12 w-12 items-center justify-center rounded-card bg-brand-tint text-brand">
              <HeartPulseIcon className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-navy">{STEP_LABELS[step]}</p>

            {/* Step-specific inputs */}
            <div className="mt-2 w-full max-w-xs space-y-2">
              {/* SYMPTOMS */}
              {step === 'symptoms' && (
                <>
                  <textarea
                    value={form.symptoms}
                    onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
                    rows={3}
                    placeholder="e.g. headache, fever, sore throat for 2 days"
                    aria-label="Describe your symptoms"
                    className="w-full resize-none rounded-chip border border-line bg-white px-3 py-2.5 text-xs text-navy placeholder:text-ink-400 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15"
                  />
                  <p className="text-2xs text-ink-400">
                    Describe what you are feeling. Be as specific as you can.
                  </p>
                </>
              )}

              {/* DURATION */}
              {step === 'duration' && (
                <input
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g. 2 days, 1 week, since morning"
                  aria-label="How long have you felt this way"
                  className="w-full rounded-chip border border-line bg-white px-3 py-2.5 text-xs text-navy placeholder:text-ink-400 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              )}

              {/* AGE GROUP */}
              {step === 'age' && (
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Age group">
                  {AGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, ageGroup: opt.value }))}
                      aria-pressed={form.ageGroup === opt.value}
                      className={cn(
                        'rounded-chip border px-3 py-2.5 text-xs font-medium transition-colors',
                        form.ageGroup === opt.value
                          ? 'border-brand bg-brand-tint text-brand'
                          : 'border-line bg-white text-ink-600 hover:border-brand/30',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* CONTEXT */}
              {step === 'context' && (
                <textarea
                  value={form.context}
                  onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
                  rows={3}
                  placeholder="Any allergies, medications, pre-existing conditions? (optional)"
                  aria-label="Additional context"
                  className="w-full resize-none rounded-chip border border-line bg-white px-3 py-2.5 text-xs text-navy placeholder:text-ink-400 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              )}

              {/* REVIEW */}
              {step === 'review' && (
                <div className="space-y-2 text-left">
                  <div className="rounded-card border border-line bg-line-soft p-3">
                    <p className="text-2xs font-medium text-ink-500">Symptoms</p>
                    <p className="mt-0.5 text-xs text-navy">{form.symptoms || '—'}</p>
                  </div>
                  {form.duration && (
                    <div className="rounded-card border border-line bg-line-soft p-3">
                      <p className="text-2xs font-medium text-ink-500">Duration</p>
                      <p className="mt-0.5 text-xs text-navy">{form.duration}</p>
                    </div>
                  )}
                  <div className="rounded-card border border-line bg-line-soft p-3">
                    <p className="text-2xs font-medium text-ink-500">Age group</p>
                    <p className="mt-0.5 text-xs text-navy">
                      {AGE_OPTIONS.find((o) => o.value === form.ageGroup)?.label}
                    </p>
                  </div>
                  {form.context && (
                    <div className="rounded-card border border-line bg-line-soft p-3">
                      <p className="text-2xs font-medium text-ink-500">Additional context</p>
                      <p className="mt-0.5 text-xs text-navy">{form.context}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ---- Bottom action bar ---- */}
      <div className="flex items-center gap-2 border-t border-line px-3 py-2.5 sm:px-4">
        {/* Chat input when showing follow-up chat */}
        {showChat && triageResult ? (
          <>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              rows={1}
              placeholder="Ask a follow-up question…"
              aria-label="Follow-up question"
              className="max-h-28 min-h-[42px] flex-1 resize-none rounded-chip border border-line bg-white px-3 py-2.5 text-xs text-navy placeholder:text-ink-400 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={!input.trim() || busy}
              aria-label="Send"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-chip bg-brand text-white transition-colors duration-150 ease-out hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            {currentStepIndex > 0 && !triageResult && !triageLoading && (
              <button
                type="button"
                onClick={prevStep}
                className="rounded-chip border border-line px-3 py-2.5 text-xs font-medium text-ink-600 transition-colors hover:border-brand/30 hover:text-brand"
              >
                Back
              </button>
            )}

            {step === 'review' && !triageResult && !triageLoading ? (
              <button
                type="button"
                onClick={runTriage}
                disabled={!canProceed()}
                className="ml-auto flex items-center gap-1.5 rounded-chip bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HeartPulseIcon className="h-3.5 w-3.5" />
                Get care guidance
              </button>
            ) : !triageResult && !triageLoading ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="ml-auto flex items-center gap-1.5 rounded-chip bg-brand px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}