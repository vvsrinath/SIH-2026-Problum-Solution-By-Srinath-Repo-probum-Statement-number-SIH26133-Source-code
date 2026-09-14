import { useNavigate } from 'react-router-dom';
import {
  ActivityIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BellRingIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  FolderLockIcon,
  HospitalIcon,
  ListChecksIcon,
  LockIcon,
  MapPinIcon,
  PhoneIcon,
  RepeatIcon,
  ScanLineIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  StethoscopeIcon,
  UserCheckIcon,
  UsersIcon,
  VideoIcon,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { GovernmentStrip } from '../../components/gov/GovernmentStrip';
import { heroImage } from '../../data/siteContent';
import { cn } from '../../utils/cn';

const journey = [
  { icon: MapPinIcon, title: 'Access Care', text: 'Start care close to home — online or with a health worker.' },
  { icon: ScanLineIcon, title: 'Check Symptoms', text: 'Get transparent, rule-based care guidance.' },
  { icon: HospitalIcon, title: 'Find Nearby Facility', text: 'Discover PHCs, hospitals and specialists near you.' },
  { icon: CalendarDaysIcon, title: 'Book Appointment', text: 'Pick a doctor and time that suits you.' },
  { icon: ListChecksIcon, title: 'Join Queue', text: 'Get a token and track your turn in the queue.' },
  { icon: VideoIcon, title: 'Consult Doctor', text: 'Talk to a doctor in person or online.' },
  { icon: RepeatIcon, title: 'Receive Referral', text: 'Move to a specialist without restarting.' },
  { icon: BellRingIcon, title: 'Complete Follow-up', text: 'Stay on track with reminders and plans.' },
  { icon: FolderLockIcon, title: 'Access Health Records', text: 'Your records, controlled by your consent.' },
];

const whySwasthyaSathi = [
  { icon: ArrowRightIcon, title: 'One connected journey', text: 'Access to follow-up in a single platform — no lost steps.' },
  { icon: UsersIcon, title: 'Rural-friendly access', text: 'Smartphone, basic phone and health-worker assisted access.' },
  { icon: ClipboardCheckIcon, title: 'Transparent care guidance', text: 'Rule-based symptom assessment with clear reasoning.' },
  { icon: CalendarDaysIcon, title: 'Appointment & queue coordination', text: 'Token-based queues and slot booking that avoids double-booking.' },
  { icon: RepeatIcon, title: 'Referral continuity', text: 'Referrals travel with the patient record, not on paper alone.' },
  { icon: StethoscopeIcon, title: 'Health worker assistance', text: 'Community health workers guide patients at every step.' },
  { icon: ShieldCheckIcon, title: 'Consent-based records', text: 'Health information is shared only with consent.' },
  { icon: ActivityIcon, title: 'Low-bandwidth design', text: 'Lighter pages, offline drafts and PWA support for weak networks.' },
];

const accessModes = [
  {
    icon: SmartphoneIcon,
    title: 'Smartphone',
    sub: 'Swasthya Sathi PWA',
    text: 'Installable app that works on Android with limited connectivity, offline drafts and secure login.',
    badge: 'Live demo',
    action: 'Try the app',
    to: '/login',
  },
  {
    icon: PhoneIcon,
    title: 'Basic Phone',
    sub: 'IVR / SMS / USSD assisted access',
    text: 'Call-based and message-based access so feature phones can still reach healthcare information.',
    badge: 'Planned / Integration-ready',
    planned: true,
  },
  {
    icon: UsersIcon,
    title: 'No Smartphone',
    sub: 'Health Worker / PHC assisted access',
    text: 'Community health workers and Primary Health Centres access the platform on the patient\u2019s behalf.',
    badge: 'In platform',
    action: 'Health worker view',
    to: '/worker',
  },
];

const services = [
  { icon: MapPinIcon, title: 'Find Nearby Care', text: 'Hospitals, PHCs, doctors and services near you.', to: '/patient/find-healthcare' },
  { icon: ScanLineIcon, title: 'Check Symptoms', text: 'Calm, step-by-step care guidance.', to: '/patient' },
  { icon: CalendarDaysIcon, title: 'Book Appointment', text: 'Choose doctor, date and time.', to: '/patient/appointments' },
  { icon: ListChecksIcon, title: 'Live Queue', text: 'Track your token in real time.', to: '/patient/appointments' },
  { icon: VideoIcon, title: 'Consultation', text: 'In-person or online consultation.', to: '/patient/consult-online' },
  { icon: RepeatIcon, title: 'Referral', text: 'Specialist care, without restarting.', to: '/patient/referrals' },
  { icon: BellRingIcon, title: 'Follow-up', text: 'Plans and reminders that stay with you.', to: '/patient/follow-up' },
  { icon: FolderLockIcon, title: 'Health Records', text: 'Your authorized records, in one place.', to: '/patient/records' },
  { icon: StethoscopeIcon, title: 'Health Worker Assistance', text: 'Ask a health worker for help.', to: '/patient/assistant' },
  { icon: ShieldCheckIcon, title: 'Privacy and Consent', text: 'You control how health data is shared.', to: '/patient/records' },
];

const trustPoints = [
  { icon: UserCheckIcon, title: 'Consent-based access', text: 'Nothing is shared without your permission.' },
  { icon: ShieldCheckIcon, title: 'Role-based permissions', text: 'Everyone sees only what their role allows.' },
  { icon: LockIcon, title: 'Secure authentication', text: 'Protected sessions and safe sign-in.' },
  { icon: FileTextIcon, title: 'Audit logging', text: 'Sensitive actions are recorded for security.' },
  { icon: FolderLockIcon, title: 'Privacy controls', text: 'Simple controls over your health information.' },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-shell px-4 sm:px-6">
      {/* ============================= HERO ============================= */}
      <section className="grid items-center gap-8 pb-12 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-tint px-3.5 py-1.5 text-xs font-medium text-brand">
            <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Smart India Hackathon 2026 · SIH26133
          </span>

          <h1 className="mt-5 text-[34px] font-bold leading-[1.12] tracking-[-0.02em] text-navy sm:text-[44px] lg:text-[50px]">
            Better Healthcare.
            <br />
            <span className="text-brand">For Every Village.</span>
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink-500">
            Swasthya Sathi connects people to healthcare access, transparent
            assessment, nearby facilities, appointments, consultation, referral
            and follow-up through one connected platform.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={() => navigate('/patient/find-healthcare')}
              className="w-full sm:w-auto"
              aria-label="Find Healthcare"
            >
              Find Healthcare
              <MapPinIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto"
            >
              Get Started
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold tracking-wide text-amber-900">
            <BellRingIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            NO SMARTPHONE &ne; NO DIGITAL HEALTHCARE
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
            <img
              src={heroImage}
              alt="A health worker and a doctor supporting a family at a rural Primary Health Centre"
              className="h-full max-h-[440px] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 left-4 right-4 hidden rounded-card border border-line bg-white p-3.5 shadow-pop sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-health-tint text-health">
                <ShieldCheckIcon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs font-semibold text-navy">
                  Privacy by consent
                </span>
                <span className="block text-2xs text-ink-500">
                  Aligned with DPDP Act 2023 principles
                </span>
              </span>
            </div>
            <span className="hidden items-center gap-1.5 text-2xs font-medium text-health md:flex lg:hidden xl:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-health ss-live-dot" aria-hidden="true" />
              Demo environment
            </span>
          </div>
        </div>
      </section>

      {/* ========================= THE JOURNEY ========================= */}
      <section aria-labelledby="journey-heading" className="py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            The Healthcare Journey
          </p>
          <h2 id="journey-heading" className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
            One connected journey, from care to records
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-500">
            From finding care to follow-up, Swasthya Sathi keeps the healthcare
            journey connected.
          </p>
        </div>

        {/* Desktop: horizontal connected timeline */}
        <ol className="mt-10 hidden grid-cols-3 gap-x-6 gap-y-8 lg:grid">
          {journey.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative">
                {i < journey.length - 1 && (
                  <span
                    className="absolute left-[calc(2rem+26px)] right-0 top-6 hidden h-px translate-y-0 bg-line xl:block"
                    aria-hidden="true"
                  />
                )}
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-card',
                      i % 2 === 0
                        ? 'border-brand/20 bg-brand-tint text-brand'
                        : 'border-health/20 bg-health-tint text-health'
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400">
                      Step {String(i + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-navy">{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-ink-500">{step.text}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Mobile/tablet: vertical timeline */}
        <ol className="mt-8 space-y-2 lg:hidden">
          {journey.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-3 rounded-card border border-line bg-white p-3">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    i % 2 === 0 ? 'bg-brand-tint text-brand' : 'bg-health-tint text-health'
                  )}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-ink-400">
                      Step {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-navy">{step.title}</span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink-500">{step.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ======================= WHY SWASTHYA SATHI ===================== */}
      <section aria-labelledby="why-heading" className="border-t border-line bg-white py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-health">
            Why Swasthya Sathi
          </p>
          <h2 id="why-heading" className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
            Built for the communities that need it most
          </h2>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whySwasthyaSathi.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-card border border-line bg-surface-soft p-4.5 transition-shadow hover:shadow-card">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint text-brand">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-navy">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-ink-500">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ======================== ACCESS FOR EVERYONE =================== */}
      <section aria-labelledby="access-heading" className="py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            Access for Everyone
          </p>
          <h2 id="access-heading" className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
            Healthcare that reaches every kind of phone
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-500">
            Connected healthcare access for rural and underserved communities.
          </p>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {accessModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <article key={mode.title} className="flex flex-col rounded-card border border-line bg-white p-5 shadow-card">
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-xl',
                      mode.planned ? 'bg-warn-tint text-warn' : 'bg-health-tint text-health'
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-2xs font-semibold',
                      mode.planned
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-health/25 bg-health-tint text-health-dark'
                    )}
                  >
                    {mode.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-navy">{mode.title}</h3>
                <p className="mt-0.5 text-xs font-medium text-ink-400">{mode.sub}</p>
                <p className="mt-2 flex-1 text-xs leading-5 text-ink-500">{mode.text}</p>
                {mode.action && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4 self-start"
                    onClick={() => navigate(mode.to!)}
                  >
                    {mode.action}
                    <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* ============================ SERVICES ========================== */}
      <section aria-labelledby="services-heading" className="border-t border-line bg-white py-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-health">
            Services
          </p>
          <h2 id="services-heading" className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
            Everything you need, step by step
          </h2>
        </div>

        <div className="mt-9 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.title}
                type="button"
                onClick={() => navigate(service.to)}
                className="group flex flex-col rounded-card border border-line bg-surface-soft p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-navy">{service.title}</h3>
                <p className="mt-1 flex-1 text-xs leading-5 text-ink-500">{service.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-2xs font-semibold text-brand">
                  Open
                  <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ======================== TRUST & PRIVACY ======================= */}
      <section aria-labelledby="trust-heading" className="py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Trust and Privacy
            </p>
            <h2 id="trust-heading" className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
              Your health information is protected
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Access is controlled by your consent, and only authorized healthcare
              professionals can view relevant information. Sensitive actions are
              recorded for security.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <li key={point.title} className="flex gap-2.5 rounded-card border border-line bg-white p-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-health-tint text-health">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold text-navy">{point.title}</span>
                      <span className="block text-2xs leading-4 text-ink-500">{point.text}</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 rounded-card border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-start gap-2 text-xs leading-5 text-amber-900">
                <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Medical disclaimer:</strong> Swasthya Sathi provides care guidance
                  and decision support only. It does not diagnose medical conditions and
                  does not replace a qualified healthcare professional.
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-line bg-[#eaf1fe] p-6 shadow-card lg:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: UserCheckIcon, label: 'Consent-based access', value: 'You decide' },
                  { icon: ShieldCheckIcon, label: 'Role-based permissions', value: 'Least access' },
                  { icon: LockIcon, label: 'Secure authentication', value: 'Protected session' },
                  { icon: BadgeCheckIcon, label: 'Audit logging', value: 'Recorded actions' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="rounded-card border border-brand/15 bg-white/85 p-4">
                      <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
                      <p className="mt-2 text-sm font-semibold text-navy">{card.label}</p>
                      <p className="text-2xs text-ink-500">{card.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-card border border-line bg-white p-5">
              <p className="text-xs font-semibold text-navy">Connected healthcare, end to end</p>
              <p className="mt-1 text-2xs leading-5 text-ink-500">
                Access &rarr; Assessment &rarr; Discovery &rarr; Appointment &rarr; Queue
                &rarr; Consultation &rarr; Referral &rarr; Follow-up &rarr; Health Records
                &rarr; Privacy &mdash; one connected journey.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/how-it-works')}
              >
                How it works
                <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <GovernmentStrip />
    </div>
  );
}