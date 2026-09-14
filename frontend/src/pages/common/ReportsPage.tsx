import { FileTextIcon, PrinterIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchReports } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';
import type { Report, ReportCategory, ReportStatus } from '../../types/workspaces';

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  LAB: 'Lab',
  IMAGING: 'Imaging',
  PATHOLOGY: 'Pathology',
  SCREENING: 'Screening',
};

const CATEGORY_TONE: Record<ReportCategory, 'info' | 'success' | 'pending' | 'neutral'> = {
  LAB: 'info',
  IMAGING: 'pending',
  PATHOLOGY: 'success',
  SCREENING: 'neutral',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: 'Pending',
  READY: 'Ready',
  REVIEWED: 'Reviewed',
};

export function ReportsPage({ emptyTitle = 'No reports to review' }: { emptyTitle?: string }) {
  const { data, loading, error, reload } = useAsync(() => fetchReports(), []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Reports</h1>
          <p className="mt-0.5 text-2xs text-ink-500">
            Lab, imaging and screening reports shared with you.
          </p>
        </div>
        <Button size="sm" variant="secondary" className="ss-no-print" onClick={() => window.print()}>
          <PrinterIcon className="h-3.5 w-3.5" /> Print
        </Button>
      </div>

      {loading && <LoadingState rows={3} label="Loading reports" />}

      {!loading && error && (
        <ErrorState title="Couldn't load reports" detail={error.message} onRetry={reload} />
      )}

      {!loading && !error && data && data.length === 0 && (
        <Panel>
          <EmptyState
            icon={<FileTextIcon className="h-4 w-4" />}
            title={emptyTitle}
            description="Reports uploaded by diagnostic centres will be queued here for review."
          />
        </Panel>
      )}

      {!loading && !error && data && data.length > 0 && (
        <div className="space-y-2">
          {data.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function reportTone(status: ReportStatus): 'pending' | 'success' | 'info' | 'neutral' {
  if (status === 'READY') return 'success';
  if (status === 'PENDING') return 'pending';
  return 'info';
}

function ReportRow({ report }: { report: Report }) {
  return (
    <article className="flex items-start gap-3 rounded-card border border-line bg-white px-3 py-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
        <FileTextIcon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-xs font-medium text-navy">{report.title}</p>
          <StatusBadge status={CATEGORY_LABEL[report.category]} tone={CATEGORY_TONE[report.category]} />
        </div>
        <p className="mt-0.5 text-2xs text-ink-500">
          {report.patientName} · {report.facility}
        </p>
        {report.summary && (
          <p className="mt-1 rounded-card border border-line bg-brand-tint2 px-2.5 py-1.5 text-2xs leading-5 text-ink-600">
            {report.summary}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-2xs text-ink-400">{formatLocalDateTime(report.orderedAt)}</span>
        <StatusBadge status={STATUS_LABEL[report.status]} tone={reportTone(report.status)} />
      </div>
    </article>
  );
}