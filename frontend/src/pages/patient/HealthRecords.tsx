import { useMemo, useState } from 'react';
import { Tabs } from '../../components/common/Tabs';
import { Panel } from '../../components/common/Panel';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { HealthRecordCard } from '../../components/healthcare/HealthRecordCard';
import { useAsync } from '../../hooks/useAsync';
import { listDocuments, documentCategory, formatLocalDateTime } from '../../api/services';
import type { HealthRecord } from '../../types';

export function HealthRecords() {
  const documents = useAsync(() => listDocuments(), []);
  const [tab, setTab] = useState('All Records');
  const [openRecord, setOpenRecord] = useState<HealthRecord | null>(null);

  const categories = useMemo(
    () => Array.from(new Set((documents.data?.files ?? []).map((file) => documentCategory(file.mime)))),
    [documents.data],
  );

  const tabs = useMemo(() => ['All Records', ...categories], [categories]);

  const records = useMemo<HealthRecord[]>(() => {
    const files = documents.data?.files ?? [];
    return files.map((file) => ({
      id: file.refId,
      title: file.filename,
      date: formatLocalDateTime(file.createdAt),
      provider: 'Encrypted document',
      category: documentCategory(file.mime) as HealthRecord['category'],
    }));
  }, [documents.data]);

  const visible = useMemo(
    () => (tab === 'All Records' ? records : records.filter((record) => record.category === tab)),
    [records, tab],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
            Health Records
          </h1>
          <p className="mt-0.5 text-2xs text-ink-500">
            Your encrypted documents (reports, prescriptions and immunisation cards).
          </p>
        </div>
        {categories.length > 0 && <Tabs tabs={tabs} active={tab} onChange={setTab} />}
      </div>

      <Panel>
        {documents.loading && <LoadingState rows={4} label="Loading records" />}

        {!documents.loading && documents.error && (
          <ErrorState
            title="Encrypted records unavailable"
            detail={`${documents.error.message} Record storage (GovDrive) is not connected in this development environment.`}
            onRetry={documents.reload}
          />
        )}

        {!documents.loading && !documents.error && visible.length === 0 && (
          <EmptyState
            title="No records yet"
            description="Documents uploaded to your encrypted vault will appear here. Nothing has been uploaded for this account."
          />
        )}

        {!documents.loading && !documents.error && visible.length > 0 && (
          <div className="space-y-2">
            {visible.map((record) => (
              <HealthRecordCard key={record.id} record={record} onView={setOpenRecord} />
            ))}
          </div>
        )}
      </Panel>

      <p className="text-2xs text-ink-400">
        Documents are encrypted client-side before upload and are never stored as plaintext on
        the server.
      </p>

      <Modal
        open={Boolean(openRecord)}
        onClose={() => setOpenRecord(null)}
        title={openRecord?.title ?? ''}
        description={openRecord ? `${openRecord.date} · ${openRecord.provider}` : undefined}
        footer={
          <Button variant="secondary" onClick={() => setOpenRecord(null)}>
            Close
          </Button>
        }
      >
        <p className="leading-5">
          Document preview is not part of this prototype. In a full build, the file would decrypt
          on the client and open here with options to download or share it with a doctor.
        </p>
      </Modal>
    </div>
  );
}