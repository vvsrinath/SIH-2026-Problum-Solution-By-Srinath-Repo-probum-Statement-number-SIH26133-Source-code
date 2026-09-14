import { AlertCircleIcon, BellRingIcon, PillIcon } from 'lucide-react';
import { SectionHeading } from '../../components/common/SectionHeading';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchPrescriptions } from '../../api/workspaces';
import { getSelf, formatLocalDate } from '../../api/services';
import type { Prescription } from '../../types/workspaces';

function activeMedicines(prescriptions: Prescription[]) {
  return prescriptions.flatMap((prescription) =>
    prescription.items.map((item, index) => ({
      key: `${prescription.id}-${index}`,
      medicine: item.medicine,
      dosage: item.dosage,
      duration: item.duration,
      instructions: item.instructions,
      doctorName: prescription.doctorName,
      issuedAt: prescription.issuedAt,
    })),
  );
}

export function Medicines() {
  const prescriptions = useAsync(() => fetchPrescriptions(), []);
  const self = useAsync(() => getSelf(), []);

  const list = prescriptions.data ?? [];
  const patientId = self.data?.profile?.patientId;
  const ownList = patientId ? list.filter((p) => p.patientId === patientId) : [];
  const medicines = activeMedicines(ownList.length > 0 ? ownList : list);

  const { loading, error, reload } = prescriptions;
  const nextDoseSoon =
    medicines.findIndex(
      (item) => /paracetamol|cetirizine/i.test(item.medicine),
    );

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Medicines"
        subtitle="Medications prescribed and recommended for your care"
      />

      {loading && <LoadingState rows={3} label="Loading medicines" />}

      {!loading && error && (
        <ErrorState title="Failed to load medicines" detail={error.message} onRetry={reload} />
      )}

      {!loading && !error && medicines.length > 0 && (
        <>
          <Panel title="Currently Taking">
            <div className="space-y-2">
              {medicines.map((item) => (
                <article key={item.key} className="flex items-start gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <PillIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold text-navy">{item.medicine}</p>
                      <StatusBadge status="Active" tone="success" />
                    </div>
                    <p className="mt-1 text-2xs text-ink-500">
                      {item.dosage} · {item.duration}
                    </p>
                    {item.instructions && (
                      <p className="mt-1 text-2xs italic text-ink-400">
                        Note: {item.instructions}
                      </p>
                    )}
                    <p className="mt-1 text-2xs text-ink-400">
                      Prescribed by {item.doctorName} on {formatLocalDate(item.issuedAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          {nextDoseSoon >= 0 && (
            <div className="flex gap-2 rounded-card border border-line bg-green-50 p-3">
              <BellRingIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div className="text-2xs leading-5 text-emerald-900">
                <p className="font-semibold">Timing reminder</p>
                <p className="mt-0.5">
                  {medicines[nextDoseSoon].medicine} — take {medicines[nextDoseSoon].dosage.toLowerCase()} as prescribed. Set a daily reminder so you do not miss a dose.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && medicines.length === 0 && (
        <Panel title="Currently Taking">
          <EmptyState
            icon={<PillIcon />}
            title="No medicines on record"
            description="Prescriptions issued during consultations are not yet synchronised in this environment. Check back after a consultation that issues a prescription."
          />
        </Panel>
      )}

      <Panel title="Tips for Medicine Safety">
        <div className="space-y-2">
          <div className="flex gap-2 rounded-card border border-line bg-blue-50 p-3">
            <AlertCircleIcon className="h-4 w-4 flex-shrink-0 text-blue-700 mt-0.5" />
            <div className="text-2xs text-blue-900">
              <p className="font-semibold">Take medicines on time</p>
              <p className="mt-0.5">Set a reminder on your phone to take medicines at the same time every day.</p>
            </div>
          </div>
          <div className="flex gap-2 rounded-card border border-line bg-amber-50 p-3">
            <AlertCircleIcon className="h-4 w-4 flex-shrink-0 text-amber-700 mt-0.5" />
            <div className="text-2xs text-amber-900">
              <p className="font-semibold">Do not stop abruptly</p>
              <p className="mt-0.5">Do not stop any medicine without talking to your doctor first.</p>
            </div>
          </div>
          <div className="flex gap-2 rounded-card border border-line bg-emerald-50 p-3">
            <AlertCircleIcon className="h-4 w-4 flex-shrink-0 text-emerald-700 mt-0.5" />
            <div className="text-2xs text-emerald-900">
              <p className="font-semibold">Keep records updated</p>
              <p className="mt-0.5">Tell your doctor about any side effects or changes in how you feel.</p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}