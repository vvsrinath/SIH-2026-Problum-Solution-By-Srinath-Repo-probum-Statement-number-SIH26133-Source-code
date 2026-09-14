import { useState } from 'react';
import { ClipboardListIcon, PlusIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { RuleTriageWizard } from '../../components/healthcare/RuleTriageWizard';
import { useAsync } from '../../hooks/useAsync';
import { fetchTriageNotes } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';
import type { RuleAssessment } from '../../types';
import type { TriageNote } from '../../types/workspaces';

type Tab = 'assess' | 'notes';

function riskTone(risk: TriageNote['risk']): { label: string; tone: 'success' | 'pending' | 'danger' | 'neutral' } {
  if (risk === 'URGENT') return { label: 'Urgent', tone: 'danger' };
  if (risk === 'HIGH') return { label: 'High', tone: 'danger' };
  if (risk === 'MODERATE') return { label: 'Moderate', tone: 'pending' };
  if (risk === 'LOW') return { label: 'Low', tone: 'success' };
  return { label: 'Unknown', tone: 'neutral' };
}

export function WorkerTriage() {
  const { data: notes, loading, error, reload } = useAsync(() => fetchTriageNotes(), []);
  const [tab, setTab] = useState<Tab>('assess');
  const [sessionNotes, setSessionNotes] = useState<TriageNote[]>([]);

  const handleSave = (assessment: RuleAssessment, meta: { patientName: string; symptoms: string }) => {
    const note: TriageNote = {
      id: `session-${Date.now()}`,
      patientName: meta.patientName || 'Unnamed patient',
      capturedAt: new Date().toISOString(),
      symptoms: meta.symptoms,
      risk: assessment.riskLevel,
      outcome: assessment.recommendedAction,
    };
    setSessionNotes((prev) => [note, ...prev]);
    setTab('notes');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Field triage</h1>
          <p className="mt-0.5 text-2xs text-ink-500">
            Run a rule-based symptom assessment or review notes captured during home visits.
          </p>
        </div>
        <div className="inline-flex rounded-chip border border-line bg-white p-0.5">
          {([
            { id: 'assess', label: 'New assessment' },
            { id: 'notes', label: `Triage notes${sessionNotes.length ? ` (${sessionNotes.length})` : ''}` },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-2xs font-medium transition-colors duration-150 ease-out',
                tab === item.id
                  ? 'bg-brand text-white'
                  : 'text-ink-500 hover:text-navy',
              )}
            >
              {item.id === 'assess' && <PlusIcon className="h-3 w-3" />}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'assess' ? (
        <RuleTriageWizard
          title="Patient triage assessment"
          subtitle="Select the patient's symptoms and answer a few details to get a risk level and care guidance."
          showPatientName
          submitLabel="Assess patient"
          resultTitle="Triage assessment result"
          saveLabel="Save triage note"
          onSave={handleSave}
        />
      ) : (
        <Panel>
          {sessionNotes.length > 0 && (
            <div className="mb-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                This session
              </p>
              {sessionNotes.map((note) => (
                <TriageNoteRow key={note.id} note={note} isNew />
              ))}
            </div>
          )}

          {loading && <LoadingState rows={4} label="Loading triage notes" />}
          {!loading && error && (
            <ErrorState title="Couldn't load triage notes" detail={error.message} onRetry={reload} />
          )}
          {!loading && !error && notes && notes.length === 0 && sessionNotes.length === 0 && (
            <EmptyState
              icon={<ClipboardListIcon className="h-4 w-4" />}
              title="No triage notes captured"
              description="Run a new assessment to capture a patient's symptoms and risk level."
            />
          )}
          {!loading && !error && notes && notes.length > 0 && (
            <div className="space-y-2">
              {sessionNotes.length > 0 && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  Recorded visits
                </p>
              )}
              {notes.map((note) => (
                <TriageNoteRow key={note.id} note={note} />
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function TriageNoteRow({ note, isNew = false }: { note: TriageNote; isNew?: boolean }) {
  const risk = riskTone(note.risk);
  return (
    <article
      className={cn(
        'rounded-card border bg-white px-3 py-2.5',
        isNew ? 'border-brand/30 ring-1 ring-brand/10' : 'border-line',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-navy">{note.patientName}</p>
          <p className="mt-0.5 text-2xs leading-5 text-ink-500">{note.symptoms}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-2xs text-ink-400">{formatLocalDateTime(note.capturedAt)}</span>
          <StatusBadge status={risk.label} tone={risk.tone} />
        </div>
      </div>
      <p className="mt-2 rounded-card border border-line bg-brand-tint2 px-2.5 py-1.5 text-2xs text-navy">
        Outcome: {note.outcome}
      </p>
    </article>
  );
}