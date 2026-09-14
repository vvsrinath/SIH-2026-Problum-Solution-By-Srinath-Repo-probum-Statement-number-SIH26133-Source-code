import { useState } from 'react';
import { PhoneIcon, VideoIcon, MicOffIcon, PhoneOffIcon, VideoOffIcon, InfoIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { fetchConsultSessions } from '../../api/workspaces';
import { formatLocalDateTime } from '../../api/services';
import { VideoCareGov } from '../../components/gov/GovImages';
import type { TeleconsultSession } from '../../types/workspaces';
import { cn } from '../../utils/cn';

const MODE_LABEL: Record<TeleconsultSession['mode'], string> = {
  VIDEO: 'Video call',
  AUDIO: 'Audio call',
};

export function ConsultOnline() {
  const { data, loading, error, reload } = useAsync(() => fetchConsultSessions(), []);
  const [activeSession, setActiveSession] = useState<TeleconsultSession | null>(null);

  const sessions = data ?? [];

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Consult Online</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Audio and video consultations with your doctors.
        </p>
      </div>

      {activeSession ? (
        <CallRoom session={activeSession} onEnd={() => setActiveSession(null)} />
      ) : (
        <>
          {loading && <LoadingState rows={3} label="Loading consultations" />}
          {!loading && error && (
            <ErrorState title="Couldn't load consultations" detail={error.message} onRetry={reload} />
          )}
          {!loading && !error && sessions.length === 0 && (
            <Panel>
              <EmptyState
                icon={<VideoIcon className="h-4 w-4" />}
                title="No consultations scheduled"
                description="Book an appointment and choose the online mode to start a consultation from here."
                action={<Button variant="secondary" to="/patient/appointments">Book an appointment</Button>}
              />
            </Panel>
          )}

          {!loading && !error && sessions.length > 0 && (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <Panel title="Upcoming sessions" subtitle="Online consultations in your schedule.">
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <article key={session.id} className="flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
                        <VideoIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-xs font-medium text-navy">{session.doctorName}</p>
                          <StatusBadge
                            status={session.status === 'ACTIVE' ? 'Online' : session.status === 'UPCOMING' ? 'Upcoming' : 'Completed'}
                            tone={session.status === 'ACTIVE' ? 'success' : 'info'}
                          />
                        </div>
                        <p className="mt-0.5 text-2xs text-ink-500">
                          {MODE_LABEL[session.mode]} · {formatLocalDateTime(session.scheduledAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={session.status !== 'ACTIVE' && session.status !== 'UPCOMING'}
                        onClick={() => setActiveSession(session)}
                      >
                        <VideoIcon className="h-3.5 w-3.5" />
                        Join
                      </Button>
                    </article>
                  ))}
                </div>
              </Panel>

              <Panel title="How online consultation works" subtitle="National teleconsultation guidance" bodyClassName="space-y-2">
                <div className="flex justify-center rounded-card border border-line bg-white p-3">
                  <VideoCareGov size={150} />
                </div>
                <ul className="space-y-1.5 text-2xs leading-5 text-ink-500">
                  <li className="flex gap-1.5"><span className="text-brand">1.</span> Join at the scheduled time when the doctor is online.</li>
                  <li className="flex gap-1.5"><span className="text-brand">2.</span> Keep your Aadhaar/ABHA and prescription handy.</li>
                  <li className="flex gap-1.5"><span className="text-brand">3.</span> Consent to the consultation before it begins.</li>
                  <li className="flex gap-1.5"><span className="text-brand">4.</span> A prescription is shared in your health records after the call.</li>
                </ul>
                <div className="flex gap-2 rounded-card border border-line bg-emerald-50 p-2.5 text-2xs leading-5 text-emerald-900">
                  <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Consultations follow the eSanjeevani / BharatVC standards for safe, consent-based remote care.
                </div>
              </Panel>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CallRoom({ session, onEnd }: { session: TeleconsultSession; onEnd: () => void }) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  return (
    <Panel className="overflow-hidden">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-card border border-line bg-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <VideoCareGov size={180} />
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/40 px-2.5 py-1 text-2xs text-white backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          {session.doctorName} · {MODE_LABEL[session.mode]}
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/40 px-2.5 py-1.5 text-2xs text-white/70 backdrop-blur-sm">
          Room: {session.roomHint}
        </div>
        <p className="absolute bottom-3 left-3 max-w-[60%] text-2xs leading-5 text-white/60">
          This is a demo consultation room. No audio or video is actually transmitted in this prototype.
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setMuted((prev) => !prev)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
            muted ? 'border-red-200 bg-red-50 text-red-600' : 'border-line bg-white text-navy hover:border-brand/30'
          )}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          <MicOffIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setVideoOff((prev) => !prev)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
            videoOff ? 'border-red-200 bg-red-50 text-red-600' : 'border-line bg-white text-navy hover:border-brand/30'
          )}
          aria-label={videoOff ? 'Turn camera on' : 'Turn camera off'}
        >
          <VideoOffIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="flex h-10 items-center gap-2 rounded-full bg-red-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-red-700"
        >
          <PhoneOffIcon className="h-4 w-4" />
          End call
        </button>
        <span className="ml-1 flex items-center gap-1.5 text-2xs text-ink-400">
          <PhoneIcon className="h-3 w-3" />
          {muted ? 'Muted' : 'Call connected'}
        </span>
      </div>
    </Panel>
  );
}