import { useMemo, useState } from 'react';
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronRightIcon,
  Loader2Icon,
  XIcon,
} from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { cn } from '../../utils/cn';
import { useAsync } from '../../hooks/useAsync';
import {
  fetchAppointments,
  fetchDoctors,
  fetchDoctorAvailability,
  createAppointment,
  cancelAppointment,
  formatLocalDateTime,
  MODE_LABEL,
  APPOINTMENT_LABEL,
  type ApiError,
} from '../../api/services';
import type {
  RealAppointment,
  DoctorPublic,
  DoctorAvailability,
  ConsultationType,
} from '../../types';

const CONSULTATION_MODES: { value: ConsultationType; label: string }[] = [
  { value: 'IN_PERSON', label: MODE_LABEL.IN_PERSON },
  { value: 'VIDEO', label: MODE_LABEL.VIDEO },
  { value: 'AUDIO', label: MODE_LABEL.AUDIO },
];

const CANCELLABLE_STATUSES = ['BOOKED', 'CONFIRMED'];

type SlotState = 'available' | 'unavailable' | 'failed';

interface SlotOption {
  iso: string;
  timeLabel: string;
  dateKey: string;
}

interface DayGroup {
  dateKey: string;
  label: string;
  slots: SlotOption[];
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Builds candidate ISO slots from weekly availability across the next 14 days. */
function computeSlots(availability: DoctorAvailability, now: Date = new Date()): SlotOption[] {
  const results: SlotOption[] = [];
  for (let offset = 0; offset < 14; offset++) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(now.getDate() + offset);
    const dayOfWeek = day.getDay();
    const dateKey = toDateKey(day);

    const exception = availability.exceptions?.find((e) => e.date === dateKey);
    if (exception && exception.reason !== 'SPECIAL_OPEN') continue;

    const weeklyEntries = availability.weekly.filter((w) => w.dayOfWeek === dayOfWeek);
    if (weeklyEntries.length === 0) continue;

    const windows: { start: number; end: number; dur: number }[] = [];
    if (exception && exception.startMinute != null && exception.endMinute != null) {
      const dur = weeklyEntries[0]?.consultationDurationMinutes ?? 30;
      windows.push({ start: exception.startMinute, end: exception.endMinute, dur });
    } else {
      for (const w of weeklyEntries) {
        windows.push({
          start: w.startMinute,
          end: w.endMinute,
          dur: w.consultationDurationMinutes || 30,
        });
      }
    }

    for (const { start, end, dur } of windows) {
      let minute = start;
      while (minute + dur <= end) {
        const slotDate = new Date(day);
        slotDate.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
        if (slotDate.getTime() > now.getTime()) {
          results.push({
            iso: slotDate.toISOString(),
            timeLabel: slotDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            dateKey,
          });
        }
        minute += dur;
      }
    }
  }
  return results;
}

function groupByDay(slots: SlotOption[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const slot of slots) {
    const found = map.get(slot.dateKey);
    if (found) {
      found.slots.push(slot);
    } else {
      const d = new Date(slot.iso);
      map.set(slot.dateKey, {
        dateKey: slot.dateKey,
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        slots: [slot],
      });
    }
  }
  return Array.from(map.values());
}

export function PatientAppointments() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>('IN_PERSON');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [slotStates, setSlotStates] = useState<Record<string, SlotState>>({});
  const [bookingSlots, setBookingSlots] = useState<Record<string, boolean>>({});
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RealAppointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const appointments = useAsync(() => fetchAppointments({ limit: 50 }), []);
  const doctors = useAsync(() => fetchDoctors({ limit: 50 }), []);
  const availability = useAsync(
    () => (selectedDoctorId ? fetchDoctorAvailability(selectedDoctorId) : Promise.resolve(null)),
    [selectedDoctorId],
  );

  const doctorList: DoctorPublic[] = doctors.data?.doctors ?? [];
  const doctorNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of doctorList) map.set(doc.doctorId, doc.displayName);
    return map;
  }, [doctorList]);

  const selectedDoctor = doctorList.find((d) => d.doctorId === selectedDoctorId) ?? null;
  const availabilityData: DoctorAvailability | null = availability.data;

  const allSlots = useMemo(
    () => (availabilityData ? computeSlots(availabilityData) : []),
    [availabilityData],
  );
  const dayGroups = useMemo(() => groupByDay(allSlots), [allSlots]);

  const activeDaySlots = dayGroups.find((d) => d.dateKey === selectedDay)?.slots ?? [];
  const selectedSlot = allSlots.find((s) => s.iso === selectedSlotIso) ?? null;

  const apptList: RealAppointment[] = appointments.data?.appointments ?? [];

  const finishBookingFlow = () => {
    setSelectedDoctorId(null);
    setConsultationType('IN_PERSON');
    setSelectedDay(null);
    setSelectedSlotIso(null);
    setReason('');
    setSlotStates({});
    setBookingSlots({});
  };

  const handleBooking = async () => {
    if (!selectedDoctorId || !selectedSlotIso) return;
    const iso = selectedSlotIso;
    setBookingError(null);
    setSuccess(null);
    setBookingSlots((prev) => ({ ...prev, [iso]: true }));
    try {
      const created = await createAppointment({
        doctorId: selectedDoctorId,
        scheduledAt: iso,
        consultationType,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      setSlotStates((prev) => ({ ...prev, [iso]: 'unavailable' }));
      setBookingSlots((prev) => ({ ...prev, [iso]: false }));
      setConfirmOpen(false);
      setSelectedSlotIso(null);
      setSelectedDay(null);
      setReason('');
      setSuccess(created);
      finishBookingFlow();
      appointments.reload();
    } catch (err) {
      const apiErr = err as ApiError;
      setSlotStates((prev) => ({ ...prev, [iso]: apiErr.kind === 'conflict' ? 'unavailable' : 'failed' }));
      setBookingSlots((prev) => ({ ...prev, [iso]: false }));
      setBookingError(
        apiErr.kind === 'conflict'
          ? 'That slot was just booked by someone else. Pick a different time.'
          : (apiErr.message ?? 'Could not book the appointment. Please try again.'),
      );
    }
  };

  const handleCancel = async (appointment: RealAppointment) => {
    if (cancellingId) return;
    setCancellingId(appointment.appointmentId);
    try {
      await cancelAppointment(appointment.appointmentId, 'Cancelled by patient');
      appointments.reload();
    } catch {
      setBookingError('Could not cancel the appointment. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const selectedSlotState: SlotState | undefined = selectedSlotIso
    ? slotStates[selectedSlotIso]
    : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">
          Book an Appointment
        </h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Pick a doctor, choose a time from their live schedule and confirm.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden" bodyClassName="p-0">
          {!selectedDoctorId ? (
            <DoctorPicker
              loading={doctors.loading}
              error={doctors.error}
              doctors={doctorList}
              onRetry={doctors.reload}
              onSelect={(id) => {
                setSelectedDoctorId(id);
                setSelectedDay(null);
                setSelectedSlotIso(null);
                setSlotStates({});
                setBookingError(null);
                setSuccess(null);
              }}
            />
          ) : (
            <>
              <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-soft px-4 py-3">
                {['Select Doctor', 'Pick a time', 'Confirm'].map((label, index) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-tint text-[10px] font-semibold text-brand">
                      {index + 1}
                    </span>
                    <span className="text-2xs font-medium text-brand">{label}</span>
                  </li>
                ))}
              </ol>

              <div className="px-4 py-4">
                {/* Doctor */}
                <div className="flex items-start gap-3 rounded-card border border-line bg-brand-tint2 p-3">
                  <Avatar name={selectedDoctor?.displayName ?? ''} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-navy">
                      {selectedDoctor?.displayName}
                    </p>
                    <p className="mt-0.5 text-2xs text-ink-500">
                      {selectedDoctor?.specialization ?? 'General'}
                    </p>
                    <p className="text-2xs text-ink-400">
                      {(selectedDoctor?.qualifications ?? []).join(', ')}
                    </p>
                    {selectedDoctor?.facilityName && (
                      <p className="text-2xs text-ink-400">{selectedDoctor.facilityName}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctorId(null)}
                    className="shrink-0 text-2xs font-medium text-brand hover:text-brand-dark"
                  >
                    Change
                  </button>
                </div>

                {/* Mode */}
                <div className="mt-5">
                  <p className="text-2xs font-medium text-ink-500">Consultation Mode</p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {CONSULTATION_MODES.map((m) => {
                      const isActive = m.value === consultationType;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => {
                            setConsultationType(m.value);
                            setBookingError(null);
                          }}
                          aria-pressed={isActive}
                          className={cn(
                            'rounded-chip border py-2 text-2xs font-medium transition-colors duration-150 ease-out',
                            isActive
                              ? 'border-brand bg-brand text-white'
                              : 'border-line bg-white text-navy hover:border-brand/30 hover:bg-brand-tint2',
                          )}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Availability */}
                {availability.loading && (
                  <div className="mt-5">
                    <p className="text-2xs font-medium text-ink-500">Select Date</p>
                    <LoadingState className="mt-2" rows={3} label="Loading availability" />
                  </div>
                )}

                {!availability.loading && availability.error && (
                  <ErrorState
                    className="mt-5"
                    title="Couldn't load availability"
                    detail={availability.error.message}
                    onRetry={availability.reload}
                  />
                )}

                {!availability.loading && !availability.error && dayGroups.length === 0 && (
                  <div className="mt-5">
                    <EmptyState
                      title="No times available"
                      description="This doctor has no available slots in the next two weeks."
                    />
                  </div>
                )}

                {!availability.loading && !availability.error && dayGroups.length > 0 && (
                  <>
                    <div className="mt-5">
                      <p className="text-2xs font-medium text-ink-500">Select Date</p>
                      <div className="mt-2 grid grid-cols-4 gap-1.5">
                        {dayGroups.map((day) => {
                          const isActive = day.dateKey === selectedDay;
                          return (
                            <button
                              key={day.dateKey}
                              type="button"
                              onClick={() => {
                                setSelectedDay(day.dateKey);
                                setSelectedSlotIso(null);
                                setBookingError(null);
                              }}
                              aria-pressed={isActive}
                              className={cn(
                                'flex flex-col items-center rounded-chip border py-2 transition-colors duration-150 ease-out',
                                isActive
                                  ? 'border-brand bg-brand text-white'
                                  : 'border-line bg-white text-navy hover:border-brand/30 hover:bg-brand-tint2',
                              )}
                            >
                              <span className="text-xs font-semibold">{day.label}</span>
                              <span
                                className={cn(
                                  'text-[10px]',
                                  isActive ? 'text-white/80' : 'text-ink-400',
                                )}
                              >
                                {day.slots.length} slot{day.slots.length > 1 ? 's' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-2xs font-medium text-ink-500">Select Time</p>
                      {activeDaySlots.length === 0 ? (
                        <p className="mt-2 text-2xs text-ink-400">
                          Pick a date to see available times.
                        </p>
                      ) : (
                        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                          {activeDaySlots.map((slot) => {
                            const state = slotStates[slot.iso] ?? 'available';
                            const isActive = slot.iso === selectedSlotIso;
                            const isBooking = bookingSlots[slot.iso];
                            const disabled =
                              state === 'unavailable' || state === 'failed' || isBooking;
                            return (
                              <button
                                key={slot.iso}
                                type="button"
                                onClick={() => selectSlot(slot.iso)}
                                aria-pressed={isActive}
                                disabled={disabled}
                                className={cn(
                                  'rounded-chip border py-2 text-2xs font-medium transition-colors duration-150 ease-out',
                                  state === 'unavailable' &&
                                    'cursor-not-allowed border-red-200 bg-red-50 text-red-400 line-through',
                                  state === 'failed' &&
                                    'cursor-not-allowed border-line bg-line-soft text-ink-400',
                                  state === 'available' &&
                                    (isActive
                                      ? 'border-brand bg-brand text-white'
                                      : 'border-line bg-white text-navy hover:border-brand/30 hover:bg-brand-tint2'),
                                )}
                              >
                                {isBooking ? (
                                  <Loader2Icon className="mx-auto h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  slot.timeLabel
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </Panel>

        <Panel title="Your Appointments" subtitle="Upcoming and past bookings.">
          {appointments.loading && <LoadingState rows={4} label="Loading appointments" />}
          {!appointments.loading && appointments.error && (
            <ErrorState
              title="Failed to load appointments"
              detail={appointments.error.message}
              onRetry={appointments.reload}
            />
          )}
          {!appointments.loading && !appointments.error && apptList.length === 0 && (
            <EmptyState
              title="No appointments yet"
              description="Book a consultation on the left and it will show up here."
            />
          )}
          {!appointments.loading && !appointments.error && apptList.length > 0 && (
            <div className="space-y-2">
              {apptList.map((appointment) => (
                <AppointmentRow
                  key={appointment.appointmentId}
                  appointment={appointment}
                  doctorName={doctorNameById.get(appointment.doctorId)}
                  cancelling={cancellingId === appointment.appointmentId}
                  onCancel={() => handleCancel(appointment)}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {bookingError && !success && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-card border border-red-200 bg-red-50 px-3 py-2.5 text-2xs text-red-700"
        >
          <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{bookingError}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-card border border-brand/30 bg-brand-tint px-3 py-2.5 text-2xs text-navy"
        >
          <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          <div>
            <p className="font-semibold text-brand">Appointment booked</p>
            <p className="mt-0.5">
              {APPOINTMENT_LABEL[success.status] ?? success.status} ·{' '}
              {formatLocalDateTime(success.scheduledAt)}
            </p>
          </div>
        </div>
      )}

      <Modal
        open={confirmOpen && !success}
        onClose={() => {
          if (Object.values(bookingSlots).some(Boolean)) return;
          setConfirmOpen(false);
          setBookingError(null);
        }}
        title="Confirm Appointment"
        description={selectedDoctor?.displayName}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setConfirmOpen(false);
                setBookingError(null);
              }}
              disabled={Object.values(bookingSlots).some(Boolean)}
            >
              Cancel
            </Button>
            <Button
              size="md"
              onClick={handleBooking}
              disabled={
                !selectedSlotIso ||
                slotStates[selectedSlotIso] === 'unavailable' ||
                bookingSlots[selectedSlotIso]
              }
            >
              {selectedSlotIso && bookingSlots[selectedSlotIso] ? (
                <>
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> Booking…
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        }
      >
        {selectedSlot && (
          <div className="space-y-3">
            <ConfirmRow label="Doctor" value={selectedDoctor?.displayName} />
            <ConfirmRow label="Mode" value={MODE_LABEL[consultationType]} />
            <ConfirmRow label="Date & time" value={formatLocalDateTime(selectedSlot.iso)} />
            {selectedSlotState === 'unavailable' && (
              <p className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-2xs text-red-700">
                That slot was just booked by someone else. Choose another time.
              </p>
            )}
            {selectedSlotState === 'failed' && (
              <p className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-2xs text-red-700">
                Could not book this slot. Please try again.
              </p>
            )}
            <Input
              label="Reason (optional)"
              placeholder="e.g. Fever and cough"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-2xs text-ink-400">
              Booking is confirmed by the server immediately. If the slot is taken, it will tell
              you.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );

  function selectSlot(iso: string) {
    setSelectedSlotIso(iso);
    setBookingError(null);
    setSuccess(null);
    setConfirmOpen(true);
  }
}

function DoctorPicker({
  loading,
  error,
  doctors,
  onRetry,
  onSelect,
}: {
  loading: boolean;
  error: Error | null;
  doctors: DoctorPublic[];
  onRetry: () => void;
  onSelect: (doctorId: string) => void;
}) {
  return (
    <div className="px-4 py-4">
      <p className="text-2xs font-medium text-ink-500">Select a Doctor</p>

      {loading && (
        <div className="mt-3 space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-3"
            >
              <span className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-line-soft" />
              <span className="flex-1 space-y-1.5">
                <span className="block h-2.5 w-1/3 animate-pulse rounded-full bg-line-soft" />
                <span className="block h-2 w-1/2 animate-pulse rounded-full bg-line-soft" />
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState
          className="mt-2"
          title="Couldn't load doctors"
          detail={error.message}
          onRetry={onRetry}
        />
      )}

      {!loading && !error && doctors.length === 0 && (
        <div className="mt-2">
          <EmptyState
            title="No doctors available"
            description="No doctors could be loaded to book with right now."
          />
        </div>
      )}

      {!loading && !error && doctors.length > 0 && (
        <div className="mt-3 space-y-2">
          {doctors.map((doc) => (
            <button
              key={doc.doctorId}
              type="button"
              onClick={() => onSelect(doc.doctorId)}
              className="flex w-full items-start gap-3 rounded-card border border-line bg-white p-3 text-left transition-colors duration-150 ease-out hover:border-brand/30 hover:bg-brand-tint2"
            >
              <Avatar name={doc.displayName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-navy">{doc.displayName}</p>
                <p className="mt-0.5 text-2xs text-ink-500">{doc.specialization ?? 'General'}</p>
                <p className="text-2xs text-ink-500">{(doc.qualifications ?? []).join(', ')}</p>
                {doc.facilityName && <p className="text-2xs text-ink-400">{doc.facilityName}</p>}
                {doc.experienceYears != null && (
                  <p className="mt-0.5 text-2xs text-ink-400">
                    {doc.experienceYears} yrs experience
                  </p>
                )}
                {doc.verified && (
                  <p className="mt-0.5 text-2xs font-medium text-brand">Verified</p>
                )}
              </div>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line-soft pb-2 text-2xs">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-navy">{value ?? '—'}</span>
    </div>
  );
}

function AppointmentRow({
  appointment,
  doctorName,
  cancelling,
  onCancel,
}: {
  appointment: RealAppointment;
  doctorName?: string;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const label = APPOINTMENT_LABEL[appointment.status] ?? appointment.status;
  const cancellable = CANCELLABLE_STATUSES.includes(appointment.status);
  return (
    <article className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[10px] font-semibold text-brand">
        {appointment.doctorId.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-navy">
          {doctorName ?? appointment.doctorId}
        </p>
        <p className="mt-0.5 truncate text-2xs text-ink-500">
          {formatLocalDateTime(appointment.scheduledAt)} ·{' '}
          {MODE_LABEL[appointment.consultationType] ?? appointment.consultationType}
        </p>
        {appointment.reason && (
          <p className="mt-0.5 truncate text-2xs text-ink-400">{appointment.reason}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusBadge status={label} />
        {cancellable && (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="inline-flex items-center gap-1 text-2xs font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
          >
            {cancelling ? (
              <Loader2Icon className="h-3 w-3 animate-spin" />
            ) : (
              <XIcon className="h-3 w-3" />
            )}
            Cancel
          </button>
        )}
      </div>
    </article>
  );
}
