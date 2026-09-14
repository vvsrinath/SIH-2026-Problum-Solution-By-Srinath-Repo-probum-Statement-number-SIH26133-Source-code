import { useState } from 'react';
import { PillIcon, PrinterIcon, RefreshCwIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { useToast } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchPrescriptions } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';
import type { Prescription } from '../../types/workspaces';

export function PrescriptionsPage() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAsync(() => fetchPrescriptions(), []);
  const [query, setQuery] = useState('');
  const [refillRequests, setRefillRequests] = useState<Set<string>>(() => new Set());

  const q = query.trim().toLowerCase();
  const filtered = (data ?? []).filter(
    (prescription) =>
      !q ||
      prescription.patientName.toLowerCase().includes(q) ||
      prescription.doctorName.toLowerCase().includes(q) ||
      prescription.diagnosis?.toLowerCase().includes(q) ||
      prescription.items.some((item) => item.medicine.toLowerCase().includes(q)),
  );

  const toggleRefill = (id: string) => {
    setRefillRequests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast('Refill request cancelled');
      } else {
        next.add(id);
        toast('Refill request sent');
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Prescriptions</h1>
          <p className="mt-0.5 text-2xs text-ink-500">
            Prescriptions issued from consultations with your care team.
          </p>
        </div>
        <Button size="sm" variant="secondary" className="ss-no-print" onClick={() => window.print()}>
          <PrinterIcon className="h-3.5 w-3.5" /> Print
        </Button>
      </div>

      <div className="ss-no-print">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search medicine, doctor or diagnosis"
          ariaLabel="Search prescriptions"
        />
      </div>

      {loading && <LoadingState rows={3} label="Loading prescriptions" />}

      {!loading && error && (
        <ErrorState title="Couldn't load prescriptions" detail={error.message} onRetry={reload} />
      )}

      {!loading && !error && data && data.length === 0 && (
        <Panel>
          <EmptyState
            icon={<PillIcon className="h-4 w-4" />}
            title="No prescriptions on record"
            description="Prescriptions issued during consultations will appear here."
          />
        </Panel>
      )}

      {!loading && !error && data && data.length > 0 && filtered.length === 0 && (
        <p className="rounded-card border border-line bg-white px-3 py-8 text-center text-2xs text-ink-500">
          No prescriptions match "{query.trim()}".
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((prescription) => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
              refillRequested={refillRequests.has(prescription.id)}
              onToggleRefill={() => toggleRefill(prescription.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PrescriptionCard({
  prescription,
  refillRequested,
  onToggleRefill,
}: {
  prescription: Prescription;
  refillRequested: boolean;
  onToggleRefill: () => void;
}) {
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-navy">
            {prescription.patientName} · {prescription.doctorName}
          </p>
          {prescription.diagnosis && (
            <p className="mt-0.5 text-2xs text-ink-500">{prescription.diagnosis}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xs text-ink-400">{formatLocalDateTime(prescription.issuedAt)}</span>
            <StatusBadge status={refillRequested ? 'Refill requested' : 'Issued'} tone={refillRequested ? 'pending' : 'success'} />
          </div>
          <Button size="sm" variant="secondary" className="ss-no-print" onClick={onToggleRefill}>
            {refillRequested ? (
              <>
                <RefreshCwIcon className="h-3.5 w-3.5" /> Cancel request
              </>
            ) : (
              <>
                <RefreshCwIcon className="h-3.5 w-3.5" /> Request refill
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {prescription.items.map((item, index) => (
          <div key={`${prescription.id}-item-${index}`} className="flex items-start gap-2.5 rounded-card border border-line bg-white px-3 py-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand">
              <PillIcon className="h-3 w-3" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-navy">{item.medicine}</span>
              <span className="mt-0.5 block text-2xs text-ink-500">
                {item.dosage} · {item.duration}
              </span>
              {item.instructions && (
                <span className="mt-1 block text-2xs italic text-ink-400">Note: {item.instructions}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {prescription.followUp && (
        <p className="mt-3 rounded-card border border-line bg-brand-tint2 px-3 py-2 text-2xs text-navy">
          Follow-up: {prescription.followUp}
        </p>
      )}
    </Panel>
  );
}