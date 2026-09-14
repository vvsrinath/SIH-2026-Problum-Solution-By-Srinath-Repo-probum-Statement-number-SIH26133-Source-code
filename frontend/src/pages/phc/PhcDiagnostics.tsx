import { FileTextIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchPhcDiagnostics } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';
import type { DiagnosticItem } from '../../types/workspaces';

function statusMeta(status: DiagnosticItem['status']): { label: string; tone: 'success' | 'pending' | 'info' } {
  if (status === 'READY') return { label: 'Ready', tone: 'success' };
  if (status === 'PENDING') return { label: 'Pending', tone: 'pending' };
  return { label: 'Reviewed', tone: 'info' };
}

export function PhcDiagnostics() {
  const { data: diagnostics, loading, error, reload } = useAsync(() => fetchPhcDiagnostics(), []);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Diagnostics</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Lab reports, imaging references and test follow-up.
        </p>
      </div>

      <Panel>
        {loading && <LoadingState rows={3} label="Loading diagnostics" />}
        {!loading && error && (
          <ErrorState title="Couldn't load diagnostics" detail={error.message} onRetry={reload} />
        )}
        {!loading && !error && diagnostics && diagnostics.length === 0 && (
          <EmptyState
            icon={<FileTextIcon className="h-4 w-4" />}
            title="No diagnostics pending"
            description="Diagnostic centre results and pending review tasks would be listed here."
          />
        )}
        {!loading && !error && diagnostics && diagnostics.length > 0 && (
          <div className="space-y-2">
            {diagnostics.map((item) => {
              const meta = statusMeta(item.status);
              return (
                <article key={item.id} className="flex items-start gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <FileTextIcon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-navy">{item.test}</p>
                    </div>
                    <p className="mt-0.5 text-2xs text-ink-500">{item.patientName}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-2xs text-ink-400">{formatLocalDateTime(item.orderedAt)}</span>
                    <StatusBadge status={meta.label} tone={meta.tone} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}