import { FolderOpenIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchPhcPatients } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';

export function PhcPatients() {
  const { data: patients, loading, error, reload } = useAsync(() => fetchPhcPatients(), []);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">PHC patients</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Clinic register and active patient lists.
        </p>
      </div>

      <Panel>
        {loading && <LoadingState rows={4} label="Loading patients" />}
        {!loading && error && (
          <ErrorState title="Couldn't load patients" detail={error.message} onRetry={reload} />
        )}
        {!loading && !error && patients && patients.length === 0 && (
          <EmptyState
            icon={<FolderOpenIcon className="h-4 w-4" />}
            title="No active registrations"
            description="Registered patients and recent visits would be tracked here."
          />
        )}
        {!loading && !error && patients && patients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-line-soft text-2xs uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-2 font-medium">Patient</th>
                  <th className="py-2 pr-2 font-medium">Age / Sex</th>
                  <th className="py-2 pr-2 font-medium">Reason</th>
                  <th className="py-2 font-medium">Last visit</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.patientId} className="border-b border-line-soft last:border-0">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-2xs font-semibold text-brand">
                          {patient.name.charAt(0)}
                        </span>
                        <span className="text-xs font-medium text-navy">{patient.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-2 text-xs text-ink-500">{patient.age} yrs · {patient.sex === 'MALE' ? 'M' : 'F'}</td>
                    <td className="py-2.5 pr-2 text-2xs text-ink-500">{patient.reason}</td>
                    <td className="py-2.5 text-2xs text-ink-500">{formatLocalDateTime(patient.lastVisitAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}