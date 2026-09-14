import { useState } from 'react';
import { UsersIcon, SearchIcon, MapPinIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Dropdown } from '../../components/common/Dropdown';
import { useAsync } from '../../hooks/useAsync';
import { fetchWorkerPatients } from '../../api/workspaces';
import type { FieldPatient } from '../../types/workspaces';

function riskLabel(risk: FieldPatient['risk']): { label: string; tone: 'success' | 'pending' | 'danger' } {
  if (risk === 'URGENT' || risk === 'HIGH') return { label: risk === 'URGENT' ? 'Urgent' : 'High risk', tone: 'danger' };
  if (risk === 'MODERATE') return { label: 'Moderate', tone: 'pending' };
  return { label: 'Low', tone: 'success' };
}

export function WorkerPatients() {
  const { data: patients, loading, error, reload } = useAsync(() => fetchWorkerPatients(), []);
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const list = (patients ?? []).filter((patient) => {
    const matchesQuery =
      patient.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      patient.village.toLowerCase().includes(query.trim().toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || patient.risk === riskFilter;
    return matchesQuery && matchesRisk;
  });

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Patient visits</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Patients assigned for home visits and screening in your cluster.
        </p>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or village"
              className="h-9 w-full rounded-chip border border-line bg-white pl-8 pr-3 text-xs text-navy placeholder:text-ink-400 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <Dropdown
            size="sm"
            ariaLabel="Filter by risk"
            value={riskFilter}
            onChange={setRiskFilter}
            className="w-[160px]"
            options={[
              { value: 'ALL', label: 'All risks' },
              { value: 'URGENT', label: 'Urgent' },
              { value: 'HIGH', label: 'High' },
              { value: 'MODERATE', label: 'Moderate' },
              { value: 'LOW', label: 'Low' },
            ]}
          />
        </div>

        <div className="mt-3">
          {loading && <LoadingState rows={4} label="Loading patient visits" />}
          {!loading && error && (
            <ErrorState title="Couldn't load patients" detail={error.message} onRetry={reload} />
          )}
          {!loading && !error && list.length === 0 && (
            <EmptyState
              icon={<UsersIcon className="h-4 w-4" />}
              title="No matching patients"
              description="Assigned households and ward-based outreach cases will appear here."
            />
          )}
          {!loading && !error && list.length > 0 && (
            <div className="space-y-2">
              {list.map((patient) => {
                const risk = riskLabel(patient.risk);
                return (
                  <article key={patient.patientId} className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-semibold text-brand">
                      {patient.name.split(' ').map((word) => word.charAt(0)).join('').slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-navy">
                        {patient.name} · {patient.age} yrs · {patient.sex === 'MALE' ? 'M' : 'F'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-2xs text-ink-500">
                        <MapPinIcon className="h-3 w-3" />
                        {patient.village} · {patient.condition}
                      </p>
                    </div>
                    <StatusBadge status={risk.label} tone={risk.tone} />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}