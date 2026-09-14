import { FileTextIcon, DownloadIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchAdminReportsList } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';

export function AdminReports() {
  const { data: reports, loading, error, reload } = useAsync(() => fetchAdminReportsList(), []);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Reports</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Operational snapshots, compliance reports and quality metrics.
        </p>
      </div>

      <Panel>
        {loading && <LoadingState rows={3} label="Loading reports" />}
        {!loading && error && (
          <ErrorState title="Couldn't load reports" detail={error.message} onRetry={reload} />
        )}
        {!loading && !error && reports && reports.length === 0 && (
          <EmptyState
            icon={<FileTextIcon className="h-4 w-4" />}
            title="No reports generated"
            description="PDF and summary reports for districts and facilities would be listed here."
          />
        )}
        {!loading && !error && reports && reports.length > 0 && (
          <div className="space-y-2">
            {reports.map((report) => (
              <article key={report.id} className="flex items-start gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                  <FileTextIcon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-navy">{report.title}</p>
                  <p className="mt-0.5 text-2xs text-ink-500">
                    {report.kind} · {report.period} · {report.sizeKb} KB · {formatLocalDateTime(report.generatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1.5 rounded-[4px] border border-line bg-white px-2.5 py-1.5 text-2xs font-medium text-ink-600 transition-colors hover:border-brand/30 hover:text-brand"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  Download
                </button>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}