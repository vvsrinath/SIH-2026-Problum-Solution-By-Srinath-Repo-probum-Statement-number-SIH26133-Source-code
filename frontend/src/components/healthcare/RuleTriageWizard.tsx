import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  HeartPulseIcon,
  Loader2Icon,
  RefreshCcwIcon,
  SaveIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserIcon,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { assessSymptomsRule, fetchRuleFollowups, fetchRuleVocabulary } from '../../api/services';
import { useAsync } from '../../hooks/useAsync';
import { Button } from '../../components/common/Button';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import type {
  RuleAssessment,
  RuleFollowupQuestion,
  RuleVocabulary,
  TriageRisk,
} from '../../types';

/* ------------------------------------------------------------------ */
/*  Offline vocabulary fallback (mirrors the backend rule set)         */
/* ------------------------------------------------------------------ */

export const FALLBACK_VOCABULARY: RuleVocabulary = {
  version: '1.0.0',
  categories: {
    respiratory: {
      label: 'Respiratory',
      symptoms: [
        { id: 'cough', label: 'Cough' },
        { id: 'shortness_of_breath', label: 'Difficulty breathing' },
        { id: 'chest_tightness', label: 'Chest tightness' },
        { id: 'sore_throat', label: 'Sore throat' },
        { id: 'nasal_congestion', label: 'Nasal congestion' },
        { id: 'wheezing', label: 'Wheezing' },
      ],
    },
    gastrointestinal: {
      label: 'Gastrointestinal',
      symptoms: [
        { id: 'stomach_pain', label: 'Stomach pain' },
        { id: 'nausea', label: 'Nausea' },
        { id: 'vomiting', label: 'Vomiting' },
        { id: 'diarrhea', label: 'Diarrhea' },
        { id: 'constipation', label: 'Constipation' },
        { id: 'loss_of_appetite', label: 'Loss of appetite' },
      ],
    },
    fever_and_pain: {
      label: 'Fever & Pain',
      symptoms: [
        { id: 'fever', label: 'Fever' },
        { id: 'headache', label: 'Headache' },
        { id: 'body_pain', label: 'Body pain' },
        { id: 'back_pain', label: 'Back pain' },
        { id: 'ear_pain', label: 'Ear pain' },
        { id: 'eye_pain', label: 'Eye pain or redness' },
      ],
    },
    cardiac: {
      label: 'Cardiac',
      symptoms: [
        { id: 'chest_pain', label: 'Chest pain' },
        { id: 'palpitations', label: 'Heart palpitations' },
      ],
    },
    general: {
      label: 'General',
      symptoms: [
        { id: 'fatigue', label: 'Fatigue or weakness' },
        { id: 'dizziness', label: 'Dizziness' },
        { id: 'weight_loss', label: 'Unexplained weight loss' },
        { id: 'swelling', label: 'Swelling' },
        { id: 'confusion', label: 'Confusion or disorientation' },
        { id: 'anxiety', label: 'Anxiety or stress' },
        { id: 'insomnia', label: 'Sleep problems' },
      ],
    },
    skin: {
      label: 'Skin',
      symptoms: [
        { id: 'rash', label: 'Skin rash' },
        { id: 'skin_lesion', label: 'Skin lesion or wound' },
      ],
    },
    urinary: {
      label: 'Urinary',
      symptoms: [
        { id: 'painful_urination', label: 'Painful urination' },
        { id: 'frequent_urination', label: 'Frequent urination' },
        { id: 'blood_in_urine', label: 'Blood in urine' },
      ],
    },
    mental_health: {
      label: 'Mental Health',
      symptoms: [
        { id: 'depression', label: 'Persistent sadness' },
        { id: 'confusion', label: 'Confusion or disorientation' },
      ],
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Risk presentation                                                  */
/* ------------------------------------------------------------------ */

export const RISK_PRESENTATION: Record<
  TriageRisk,
  { label: string; badge: string; edge: string; dot: string }
> = {
  LOW: {
    label: 'Low Risk',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    edge: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
  },
  MODERATE: {
    label: 'Moderate Risk',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    edge: 'border-l-amber-500',
    dot: 'bg-amber-500',
  },
  HIGH: {
    label: 'High Risk',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    edge: 'border-l-orange-500',
    dot: 'bg-orange-500',
  },
  URGENT: {
    label: 'Urgent — Seek Emergency Care',
    badge: 'bg-red-50 text-red-700 border-red-200',
    edge: 'border-l-red-500',
    dot: 'bg-red-500',
  },
  UNKNOWN: {
    label: 'Assessment Incomplete',
    badge: 'bg-gray-50 text-gray-600 border-gray-200',
    edge: 'border-l-gray-400',
    dot: 'bg-gray-400',
  },
};

/* ------------------------------------------------------------------ */
/*  Reusable wizard                                                    */
/* ------------------------------------------------------------------ */

type Step = 'symptoms' | 'details' | 'results';

export interface RuleTriageWizardProps {
  title: string;
  subtitle: string;
  /** Show a patient-name field before symptoms (health-worker led triage). */
  showPatientName?: boolean;
  /** Label of the final assessment button. */
  submitLabel?: string;
  /** Result panel heading. */
  resultTitle?: string;
  /** Enables a "save" action on the result; receives the assessment + captured context. */
  onSave?: (
    assessment: RuleAssessment,
    meta: { patientName: string; symptoms: string },
  ) => void;
  saveLabel?: string;
}

export function RuleTriageWizard({
  title,
  subtitle,
  showPatientName = false,
  submitLabel = 'Get care guidance',
  resultTitle = 'Care Guidance Result',
  onSave,
  saveLabel = 'Save assessment',
}: RuleTriageWizardProps) {
  const [step, setStep] = useState<Step>('symptoms');
  const [patientName, setPatientName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<RuleFollowupQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [result, setResult] = useState<RuleAssessment | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const vocab = useAsync(() => fetchRuleVocabulary(), []);
  const vocabulary = vocab.data ?? FALLBACK_VOCABULARY;

  const toggleSymptom = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const setAnswer = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const selectedLabels = useMemo(() => {
    const labelMap = new Map<string, string>();
    const vocabSource = vocab.data ?? FALLBACK_VOCABULARY;
    for (const cat of Object.values(vocabSource.categories)) {
      for (const sym of cat.symptoms) labelMap.set(sym.id, sym.label);
    }
    return selected
      .map((id) => labelMap.get(id))
      .filter((label): label is string => Boolean(label));
  }, [selected, vocab.data]);

  useEffect(() => {
    if (step !== 'details' || selected.length === 0) return;
    let active = true;
    setQuestionsLoading(true);
    fetchRuleFollowups(selected)
      .then((qs) => {
        if (active) setQuestions(qs);
      })
      .catch(() => {
        if (active) setQuestions([]);
      })
      .finally(() => {
        if (active) setQuestionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [step, selected]);

  const runAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const assessment = await assessSymptomsRule({
        symptoms: selectedLabels.join(', '),
        duration: answers.duration || undefined,
        ageGroup: answers.age_group || undefined,
        context: Object.keys(answers).length ? answers : undefined,
      });
      setResult(assessment);
      setSaved(false);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Assessment failed'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setPatientName('');
    setSelected([]);
    setAnswers({});
    setQuestions([]);
    setSaved(false);
    setStep('symptoms');
  };

  const back = () => {
    if (step === 'details') setStep('symptoms');
    else if (step === 'results') {
      setResult(null);
      setStep('details');
    }
  };

  if (step === 'results' && result) {
    return (
      <ResultsView
        result={result}
        patientName={patientName}
        resultTitle={resultTitle}
        onBack={back}
        onReset={reset}
        onSave={onSave ? () => { onSave(result, { patientName: patientName.trim(), symptoms: selectedLabels.join(', ') }); setSaved(true); } : undefined}
        saveLabel={saved ? 'Saved' : saveLabel}
        saved={saved}
      />
    );
  }

  const canAssess = selected.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-card border border-line bg-white px-3.5 py-3 shadow-card sm:px-4">
        <div>
          <h1 className="flex items-center gap-2 text-[15px] font-semibold text-navy">
            <ShieldCheckIcon className="h-4 w-4 text-brand" aria-hidden="true" />
            {title}
          </h1>
          <p className="mt-0.5 text-2xs text-ink-500">{subtitle}</p>
        </div>
        <StatusBadge status={step === 'symptoms' ? 'Symptoms' : 'Details'} tone="info" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-card border border-red-200 bg-red-50 px-3 py-2.5 text-2xs text-red-700">
          <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0" />
          Couldn't reach the assessment service. Please try again.
        </div>
      )}

      {step === 'symptoms' && (
        <Panel bodyClassName="p-3 sm:p-4">
          {showPatientName && (
            <div className="mb-4">
              <label htmlFor="rt-patient" className="block text-2xs font-medium text-navy">
                Patient name
              </label>
              <div className="relative mt-1.5 sm:w-72">
                <UserIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                <input
                  id="rt-patient"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Lakshmi Devi"
                  className="h-9 w-full rounded-chip border border-line bg-white pl-8 pr-2.5 text-xs text-navy placeholder:text-ink-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13px] font-semibold text-navy">Select symptoms</h2>
            <span className="text-2xs text-ink-400">{selected.length} selected</span>
          </div>

          <div className="mt-3 space-y-4">
            {Object.entries(vocabulary.categories).map(([key, category]) => (
              <div key={key}>
                <p className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  {category.label}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {category.symptoms.map((sym) => {
                    const active = selected.includes(sym.id);
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleSymptom(sym.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-chip border px-2.5 py-1.5 text-2xs font-medium transition-colors duration-150 ease-out',
                          active
                            ? 'border-brand/40 bg-brand-tint text-brand'
                            : 'border-line bg-white text-ink-500 hover:border-brand/30 hover:text-navy',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            active ? 'bg-brand' : 'bg-line',
                          )}
                        />
                        {sym.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selected.length > 0 && (
            <div className="mt-4 rounded-card border border-line-soft bg-line-soft/60 px-3 py-2.5">
              <p className="text-2xs font-medium text-navy">
                Selected ({selected.length}): <span className="text-ink-500">{selectedLabels.join(', ')}</span>
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              size="md"
              disabled={!canAssess}
              onClick={() => setStep('details')}
              className="gap-1.5"
            >
              Continue
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Panel>
      )}

      {step === 'details' && (
        <Panel
          title="A few more details"
          subtitle="This helps us give more accurate guidance."
          bodyClassName="p-3 sm:p-4">
          {questionsLoading ? (
            <div className="flex items-center gap-2 py-6 text-2xs text-ink-500">
              <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
              Preparing questions…
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => {
                const value = answers[q.id] ?? '';
                const useSelect = q.options.length > 5;
                return (
                  <div key={q.id}>
                    <label htmlFor={`rt-${q.id}`} className="block text-2xs font-medium text-navy">
                      {q.question}
                    </label>
                    {useSelect ? (
                      <select
                        id={`rt-${q.id}`}
                        value={value}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        className="mt-1.5 h-9 w-full rounded-chip border border-line bg-white px-2.5 text-xs text-navy focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20 sm:w-72"
                      >
                        <option value="">Prefer not to say</option>
                        {q.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {q.options.map((opt) => {
                          const active = value === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setAnswer(q.id, active ? '' : opt.value)}
                              className={cn(
                                'rounded-chip border px-2.5 py-1.5 text-2xs font-medium transition-colors duration-150 ease-out',
                                active
                                  ? 'border-brand/40 bg-brand-tint text-brand'
                                  : 'border-line bg-white text-ink-500 hover:border-brand/30 hover:text-navy',
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {questions.length === 0 && (
                <p className="rounded-card border border-line-soft bg-line-soft/50 px-3 py-2.5 text-2xs text-ink-500">
                  You can continue without extra details — we already have the symptoms.
                </p>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-2 border-t border-line-soft pt-4">
            <Button variant="ghost" size="md" onClick={back} className="gap-1.5">
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button size="md" onClick={runAssessment} disabled={loading} className="gap-1.5">
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                  Assessing…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <StethoscopeIcon className="h-3.5 w-3.5" />
                  {submitLabel}
                </span>
              )}
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Results view                                                       */
/* ------------------------------------------------------------------ */

function ResultsView({
  result,
  patientName,
  resultTitle,
  onBack,
  onReset,
  onSave,
  saveLabel,
  saved,
}: {
  result: RuleAssessment;
  patientName: string;
  resultTitle: string;
  onBack: () => void;
  onReset: () => void;
  onSave?: () => void;
  saveLabel: string;
  saved: boolean;
}) {
  const risk = RISK_PRESENTATION[result.riskLevel];
  const urgent = result.riskLevel === 'URGENT' || result.redFlags.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-[15px] font-semibold text-navy">
          <ClipboardCheckIcon className="h-4 w-4 text-brand" aria-hidden="true" />
          {resultTitle}
        </h1>
        <StatusBadge status={risk.label} className={risk.badge} />
      </div>

      {patientName && (
        <p className="text-2xs text-ink-500">
          Patient: <span className="font-medium text-navy">{patientName}</span>
        </p>
      )}

      {urgent && (
        <div className="flex items-start gap-2.5 rounded-card border border-red-200 bg-red-50 px-3.5 py-3">
          <ShieldAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-xs font-semibold text-red-700">Emergency attention recommended</p>
            <p className="mt-0.5 text-2xs leading-4 text-red-600">{result.recommendedAction}</p>
          </div>
        </div>
      )}

      <div className={cn('rounded-card border border-line border-l-4 bg-white p-3.5 shadow-card sm:p-4', risk.edge)}>
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', risk.dot)} />
          <p className="text-xs font-semibold text-navy">
            Risk level: <span className={cn('rounded-[4px] px-1.5 py-0.5 text-2xs font-medium', risk.badge)}>{result.riskLevel}</span>
          </p>
        </div>

        {result.possibleConditions.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              Possible conditions to discuss with a doctor
            </p>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              {result.possibleConditions.slice(0, 6).map((c) => (
                <li key={c} className="flex items-start gap-1.5 text-2xs text-navy">
                  <HeartPulseIcon className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.reason.length > 0 && (
          <div className="mt-3 rounded-card border border-line-soft bg-line-soft/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              Why we gave this result
            </p>
            <ul className="mt-1 space-y-0.5">
              {result.reason.slice(0, 5).map((r) => (
                <li key={r} className="text-2xs leading-4 text-ink-500">
                  • {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-line bg-white p-3.5 shadow-card">
          <p className="text-xs font-semibold text-navy">Recommended next steps</p>
          <ul className="mt-2 space-y-1.5">
            {result.nextSteps.slice(0, 5).map((s) => (
              <li key={s} className="flex items-start gap-2 text-2xs leading-4 text-ink-500">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {result.selfCare.length > 0 && (
          <div className="rounded-card border border-line bg-white p-3.5 shadow-card">
            <p className="text-xs font-semibold text-navy">Things you can do now</p>
            <ul className="mt-2 space-y-1.5">
              {result.selfCare.slice(0, 5).map((s) => (
                <li key={s} className="flex items-start gap-2 text-2xs leading-4 text-ink-500">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-health" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {result.missingInformation.length > 0 && (
        <div className="rounded-card border border-line bg-white p-3.5 shadow-card">
          <p className="text-xs font-semibold text-navy">To get more specific guidance</p>
          <p className="mt-1 text-2xs leading-4 text-ink-500">
            {result.missingInformation.join('. ')}
          </p>
        </div>
      )}

      <p className="px-1 text-2xs leading-4 text-ink-400">
        {result.disclaimer} This tool does not provide a diagnosis and is not a substitute
        for professional medical advice.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="md" onClick={onBack} className="gap-1.5">
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {onSave && (
            <Button
              size="md"
              onClick={onSave}
              disabled={saved}
              className="gap-1.5"
            >
              <SaveIcon className="h-3.5 w-3.5" />
              {saveLabel}
            </Button>
          )}
          <Button variant="secondary" size="md" onClick={onReset} className="gap-1.5">
            <RefreshCcwIcon className="h-3.5 w-3.5" />
            Start over
          </Button>
        </div>
      </div>
    </div>
  );
}