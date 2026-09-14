import { useState } from 'react';
import { MapPinIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Dropdown } from '../../components/common/Dropdown';
import { useAsync } from '../../hooks/useAsync';
import { fetchAdminFacilities } from '../../api/workspaces';
import type { AdminFacility } from '../../types/workspaces';

function statusMeta(status: AdminFacility['status']): { label: string; tone: 'success' | 'danger' | 'neutral' } {
  if (status === 'ACTIVE') return { label: 'Active', tone: 'success' };
  if (status === 'ATTENTION') return { label: 'Attention', tone: 'danger' };
  return { label: 'Closed', tone: 'neutral' };
}

export function AdminFacilities() {
  const { data: facilities, loading, error, reload } = useAsync(() => fetchAdminFacilities(), []);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const types = [...new Set((facilities ?? []).map((facility) => facility.type))];
  const list = (facilities ?? []).filter((facility) => typeFilter === 'ALL' || facility.type === typeFilter);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Facilities</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          PHCs, clinics, wellness centres and community access points.
        </p>
      </div>

      <Panel>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-2xs text-ink-500">{facilities?.length ?? 0} facilities in the network</p>
          <Dropdown
            size="sm"
            ariaLabel="Filter by facility type"
            value={typeFilter}
            onChange={setTypeFilter}
            className="w-[180px]"
            options={[{ value: 'ALL', label: 'All types' }, ...types.map((type) => ({ value: type, label: type }))]}
          />
        </div>

        {loading && <LoadingState rows={4} label="Loading facilities" />}
        {!loading && error && (
          <ErrorState title="Couldn't load facilities" detail={error.message} onRetry={reload} />
        )}
        {!loading && !error && facilities && facilities.length === 0 && (
          <EmptyState
            icon={<MapPinIcon className="h-4 w-4" />}
            title="No facilities linked"
            description="Facility directory and service availability would be tracked here."
          />
        )}
        {!loading && !error && list.length === 0 && (
          <EmptyState icon={<MapPinIcon className="h-4 w-4" />} title="No matching facilities" />
        )}
        {!loading && !error && list.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-line-soft text-2xs uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-2 font-medium">Facility</th>
                  <th className="py-2 pr-2 font-medium">Type</th>
                  <th className="py-2 pr-2 font-medium">District</th>
                  <th className="py-2 pr-2 font-medium">Doctors</th>
                  <th className="py-2 pr-2 font-medium">Staff</th>
                  <th className="py-2 pr-2 font-medium">Utilisation</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((facility) => {
                  const meta = statusMeta(facility.status);
                  return (
                    <tr key={facility.id} className="border-b border-line-soft last:border-0">
                      <td className="py-2.5 pr-2 text-xs font-medium text-navy">{facility.name}</td>
                      <td className="py-2.5 pr-2 text-2xs text-ink-500">{facility.type}</td>
                      <td className="py-2.5 pr-2 text-2xs text-ink-500">{facility.district}</td>
                      <td className="py-2.5 pr-2 text-xs text-navy">{facility.doctors}</td>
                      <td className="py-2.5 pr-2 text-xs text-navy">{facility.staff}</td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line-soft">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${facility.utilizationPct}%` }} />
                          </div>
                          <span className="text-2xs text-ink-500">{facility.utilizationPct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5"><StatusBadge status={meta.label} tone={meta.tone} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}