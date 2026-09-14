import { PillIcon, AlertTriangleIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchPhcMedicines } from '../../api/workspaces';
import { formatLocalDate } from '../../api/services';
import type { Medicine } from '../../types/workspaces';

function isLowOnStock(medicine: Medicine): boolean {
  return medicine.stock <= medicine.lowWatermark;
}

export function PhcMedicines() {
  const { data: medicines, loading, error, reload } = useAsync(() => fetchPhcMedicines(), []);

  const lowStock = (medicines ?? []).filter(isLowOnStock);
  const healthy = (medicines ?? []).filter((medicine) => !isLowOnStock(medicine));

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Medicines</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Local stock, restocking thresholds and usage trends.
        </p>
      </div>

      {loading && <LoadingState rows={3} label="Loading medicines" />}
      {!loading && error && (
        <ErrorState title="Couldn't load medicine stock" detail={error.message} onRetry={reload} />
      )}

      {!loading && !error && medicines && medicines.length === 0 && (
        <Panel>
          <EmptyState
            icon={<PillIcon className="h-4 w-4" />}
            title="No medicine inventory loaded"
            description="Stock summaries and replenishment triggers would be shown here."
          />
        </Panel>
      )}

      {!loading && !error && medicines && medicines.length > 0 && (
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel
            title="Low stock"
            subtitle="Items at or below their reorder level."
            action={lowStock.length > 0 ? <StatusBadge status={`${lowStock.length} alerts`} tone="danger" /> : undefined}
          >
            {lowStock.length === 0 ? (
              <EmptyState icon={<AlertTriangleIcon className="h-4 w-4" />} title="All stocks healthy" description="No items are below the reorder watermark." />
            ) : (
              <div className="space-y-2">
                {lowStock.map((medicine) => (
                  <article key={medicine.batch} className="flex items-center gap-3 rounded-card border border-red-200 bg-red-50 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-navy">{medicine.name}</p>
                      <p className="mt-0.5 text-2xs text-ink-500">Batch {medicine.batch} · expires {formatLocalDate(medicine.expiry)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <StatusBadge status="Reorder" tone="danger" />
                      <span className="mt-1 text-2xs text-ink-500">{medicine.stock} left</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Available stock" subtitle="Medicines meeting the reorder threshold.">
            {healthy.length === 0 ? (
              <EmptyState icon={<PillIcon className="h-4 w-4" />} title="Nothing available" description="All items need to be restocked." />
            ) : (
              <div className="space-y-2">
                {healthy.map((medicine) => (
                  <article key={medicine.batch} className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-navy">{medicine.name}</p>
                      <p className="mt-0.5 text-2xs text-ink-500">Batch {medicine.batch} · expires {formatLocalDate(medicine.expiry)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <StatusBadge status="In stock" tone="success" />
                      <span className="mt-1 text-2xs text-ink-500">{medicine.stock} units</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}