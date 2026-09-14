import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { SearchBar } from '../../components/common/SearchBar';
import { Avatar } from '../../components/common/Avatar';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchAppointments } from '../../api/services';
import type { RealAppointment } from '../../types';

interface PatientEntry {
  patientId: string;
  count: number;
  nextAt?: string;
}

export function DoctorPatients() {
  const [query, setQuery] = useState('');

  const appointments = useAsync(() => fetchAppointments({ limit: 100 }), []);

  const patients = useMemo(() => {
    const apptList: RealAppointment[] = appointments.data?.appointments ?? [];
    const map = new Map<string, PatientEntry>();
    for (const appointment of apptList) {
      const entry = map.get(appointment.patientId) ?? { patientId: appointment.patientId, count: 0 };
      entry.count += 1;
      if (!entry.nextAt || new Date(appointment.scheduledAt) < new Date(entry.nextAt)) {
        entry.nextAt = appointment.scheduledAt;
      }
      map.set(appointment.patientId, entry);
    }
    const term = query.trim().toLowerCase();
    let list = Array.from(map.values());
    if (term) {
      list = list.filter((patient) => patient.patientId.toLowerCase().includes(term));
    }
    return list.sort((a, b) => new Date(a.nextAt ?? 0).getTime() - new Date(b.nextAt ?? 0).getTime());
  }, [appointments.data, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
            Patients
          </h1>
          <p className="mt-0.5 text-2xs text-ink-500">
            Patients you have seen, derived from your appointment history.
          </p>
        </div>
        <SearchBar
          className="w-full max-w-xs"
          value={query}
          onChange={setQuery}
          placeholder="Search by patient ID"
          ariaLabel="Search patients" />
      </div>

      <Panel>
        {appointments.loading && <LoadingState rows={4} label="Loading patients" />}

        {!appointments.loading && appointments.error && (
          <ErrorState
            title="Failed to load patients"
            detail={appointments.error.message}
            onRetry={appointments.reload}
          />
        )}

        {!appointments.loading && !appointments.error && patients.length === 0 && (
          <EmptyState
            title={query ? 'No patients match your search' : 'No patients yet'}
            description={
              query
                ? 'Try another patient ID.'
                : 'Patients you have consulted will appear here once you have appointments.'
            }
          />
        )}

        {!appointments.loading && !appointments.error && patients.length > 0 && (
          <ul className="space-y-2">
            {patients.map((patient) => (
              <li key={patient.patientId}>
                <Link
                  to={`/doctor/patients/${patient.patientId}`}
                  className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5 transition-colors duration-150 ease-out hover:border-brand/30 hover:bg-brand-tint2"
                >
                  <Avatar name={patient.patientId} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-navy">
                      Patient {patient.patientId}
                    </span>
                    <span className="block truncate text-2xs text-ink-500">
                      {patient.count} appointment{patient.count > 1 ? 's' : ''}
                    </span>
                  </span>
                  {patient.nextAt && (
                    <span className="hidden text-2xs text-ink-400 sm:block">
                      Next: {new Date(patient.nextAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
