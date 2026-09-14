import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PlusIcon, ShieldAlertIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Tabs } from '../../components/common/Tabs';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Dropdown } from '../../components/common/Dropdown';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ReferralCard } from '../../components/healthcare/ReferralCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchAppointments, fetchReferrals } from '../../api/services';
import type { RealReferral, Referral } from '../../types';

const tabs = ['Consultation', 'History', 'Lab Reports', 'Prescriptions', 'Referrals'];

function Field({
  label,
  value,
  onChange,
  rows = 3,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-2xs font-medium text-ink-500">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-chip border border-line bg-white px-3 py-2 text-xs leading-5 text-navy placeholder:text-ink-400 transition-colors duration-150 ease-out focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15"
      />
    </div>
  );
}

export function PatientConsultation() {
  const { id } = useParams();
  const patientId = id ?? '';

  const [tab, setTab] = useState(tabs[0]);
  const [complaint, setComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [specialist, setSpecialist] = useState('');

  const appointments = useAsync(() => fetchAppointments({ limit: 100 }), []);
  const referrals = useAsync(() => fetchReferrals(), []);

  const patientAppointments = useMemo(
    () => (appointments.data?.appointments ?? []).filter((appointment) => appointment.patientId === patientId),
    [appointments.data, patientId],
  );

  const patientReferralHistory = useMemo(
    () => (referrals.data ?? []).filter((referral) => referral.patientId === patientId),
    [referrals.data, patientId],
  );

  const apptCount = patientAppointments.length;

  return (
    <div className="space-y-4">
      {/* Patient header */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-white px-4 py-3 shadow-card">
        <Avatar name={patientId} size="md" />
        <div className="min-w-0">
          <h1 className="truncate text-[13px] font-semibold text-navy">
            Patient {patientId}
          </h1>
          <p className="mt-0.5 text-2xs text-ink-500">
            {apptCount} appointment{apptCount !== 1 ? 's' : ''} on record
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status="Consulting" />
          <Button variant="secondary" size="sm" to="/doctor/patients">
            All patients
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} variant="underline" />

      {tab === 'Consultation' && (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel title="Consultation notes" subtitle="Recorded by the attending doctor.">
            <div className="space-y-3.5">
              <Field
                label="Chief Complaint"
                value={complaint}
                onChange={setComplaint}
                rows={2}
                placeholder="What brings the patient in today?"
              />
              <Field label="Symptoms" value={symptoms} onChange={setSymptoms} rows={3} />
              <Field
                label="Diagnosis"
                value={diagnosis}
                onChange={setDiagnosis}
                rows={2}
                placeholder="Clinical impression recorded by the doctor"
              />
              <Field label="Notes" value={notes} onChange={setNotes} rows={3} />
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel
              title="Prescription"
              action={
                <Button variant="secondary" size="sm">
                  <PlusIcon className="h-3 w-3" />
                  Add
                </Button>
              }
            >
              <EmptyState
                title="No prescription added"
                description="Prescription lines for this consultation would be captured here."
              />
            </Panel>

            <Panel title="Referral (If Required)">
              <Dropdown
                options={[
                  { value: 'cardiology', label: 'Cardiology' },
                  { value: 'pulmonology', label: 'Pulmonology' },
                  { value: 'endocrinology', label: 'Endocrinology' },
                ]}
                value={specialist}
                onChange={setSpecialist}
                placeholder="Select speciality"
                ariaLabel="Refer to specialist"
              />
              <p className="mt-2 text-2xs text-ink-400">
                A referral shares this consultation record with the selected
                specialist.
              </p>
            </Panel>

            <div className="flex items-center gap-2">
              <Button variant="secondary" className="flex-1" size="lg" disabled>
                Save &amp; Close
              </Button>
              <Button className="flex-1" size="lg" disabled>
                Create Referral
              </Button>
            </div>

            <div className="flex gap-2.5 rounded-card border border-line bg-brand-tint2 px-3 py-2.5">
              <ShieldAlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              <p className="text-2xs leading-[17px] text-ink-500">
                Prototype form — notes and prescriptions entered here are not persisted
                to the backend in this environment. All clinical decisions are recorded by
                the attending doctor; nothing here diagnoses or substitutes a qualified
                healthcare professional.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'History' && (
        <Panel title="History" subtitle="Background information from the patient's record.">
          <EmptyState
            title="History not connected"
            description="Longitudinal medical history is not available in this development environment."
          />
        </Panel>
      )}

      {tab === 'Lab Reports' && (
        <Panel title="Lab Reports">
          <EmptyState
            title="No lab reports available"
            description="Reports stored in the patient's encrypted records would appear here."
          />
        </Panel>
      )}

      {tab === 'Prescriptions' && (
        <Panel title="Prescriptions">
          <EmptyState
            title="No prescriptions available"
            description="Prescriptions issued from consultations would appear here."
          />
        </Panel>
      )}

      {tab === 'Referrals' && (
        <Panel title="Referrals">
          {referrals.loading && <LoadingState rows={3} label="Loading referrals" />}

          {!referrals.loading && referrals.error && (
            <ErrorState
              title="Failed to load referrals"
              detail={referrals.error.message}
              onRetry={referrals.reload}
            />
          )}

          {!referrals.loading && !referrals.error && patientReferralHistory.length === 0 && (
            <EmptyState
              title="No referrals for this patient"
              description="Referrals created from this consultation will be listed here."
            />
          )}

          {!referrals.loading && !referrals.error && patientReferralHistory.length > 0 && (
            <div className="space-y-2">
              {patientReferralHistory.map((referral) => (
                <ReferralCard key={referral.referralId} referral={toLegacyReferral(referral)} showReason />
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function toLegacyReferral(referral: RealReferral): Referral {
  return {
    id: referral.referralId,
    patientId: referral.patientId,
    patientName: referral.patientId,
    patientPhoto: '',
    referredTo: referral.toDoctorId ?? referral.toFacilityId ?? 'Specialist',
    specialistName: referral.toDoctorId ?? 'Specialist',
    facility: referral.toFacilityId ?? 'Referral facility',
    date: referral.createdAt,
    reason: referral.reason ?? '',
    status: referral.status === 'ACCEPTED' ? 'Accepted' : 'Pending',
    direction: 'sent' as const,
  };
}