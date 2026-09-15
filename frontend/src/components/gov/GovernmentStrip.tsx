import { IndianFlag } from './GovernmentIdentity';
import { assetUrl } from '../../lib/assets';
import {
  ABDM_ECOSYSTEM,
  GOVERNMENT_SERVICES,
  PRIVATE_TECH,
  STATUS_LABEL,
  type GovernmentIntegration,
  type IntegrationStatus,
} from './integrations';

/**
 * Government integration strip.
 *
 * Shows the REAL public-ecosystem services Swasthya Sathi connects to
 * (ABDM/ABHA/HPR/HFR/UHI, MeriPehchaan, NMC, Bhuvan, BharatVC, GovDrive)
 * with an honest readiness status for each, plus Indian private technology
 * (Mappls) clearly separated — it is not a Government of India service.
 */

const STATUS_STYLE: Record<IntegrationStatus, string> = {
  ready: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  planned: 'bg-amber-50 text-amber-700 ring-amber-200',
  future: 'bg-slate-100 text-slate-600 ring-slate-200',
  verification: 'bg-sky-50 text-sky-700 ring-sky-200',
};

function IntegrationTile({ item, size = 'md' }: { item: GovernmentIntegration; size?: 'sm' | 'md' }) {
  const tile = size === 'sm' ? 'h-10 w-10 p-1' : 'h-14 w-14 p-1.5';
  const inner = size === 'sm' ? 'max-h-full max-w-full' : 'h-full w-full';

  if (item.logo) {
    return (
      <span className={`flex ${tile} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white`}>
        <img src={item.logo} alt="" className={`${inner} object-contain`} />
      </span>
    );
  }
  if (item.icon) {
    const Icon = item.icon;
    const iconSize = size === 'sm' ? 22 : 32;
    return (
      <span className={`flex ${tile} shrink-0 items-center justify-center rounded-xl bg-brand-tint`}>
        <Icon size={iconSize} />
      </span>
    );
  }
  return (
    <span className={`flex ${tile} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white`}>
      <img
        src={assetUrl('/images/gov/emblem-of-india.svg')}
        alt="Government of India"
        className={`${inner} object-contain`}
      />
    </span>
  );
}

function IntegrationCard({ item }: { item: GovernmentIntegration }) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl border border-line bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-brand/30 hover:bg-brand-tint2">
      <IntegrationTile item={item} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[13px] font-semibold text-navy">{item.name}</p>
          <span
            className={`rounded-full px-1.5 py-px text-[9px] font-semibold ring-1 ${STATUS_STYLE[item.status]}`}
          >
            {STATUS_LABEL[item.status]}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-[15px] text-ink-500">{item.detail}</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-400">
          {item.dependency}
        </p>
      </div>
    </div>
  );
}

function IntegrationScale() {
  return (
    <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-2xl border border-line bg-brand-tint2 px-4 py-2.5 text-[11px] text-ink-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Status shown = intended integration readiness
      </span>
      <span className="flex items-center gap-1.5">
        Some steps require the patient/facility to be onboarded through the relevant government programme.
      </span>
    </div>
  );
}

export function GovernmentStrip() {
  return (
    <section aria-label="Government integrations" className="py-10">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <IndianFlag />
          <p className="text-[10px] uppercase tracking-[0.12em] text-brand">
            Government of India Integrations
          </p>
        </div>
        <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.01em] text-navy sm:text-xl">
          Built on India's Public Digital Infrastructure
        </h2>
        <p className="mx-auto mt-1 max-w-xl text-[12px] leading-5 text-ink-500">
          Swasthya Sathi connects to Government of India and public-ecosystem platforms for patient
          identity, doctor verification, facility discovery, geospatial mapping, video consultation
          and secure data exchange. Each integration shows its true readiness state.
        </p>
      </div>

      <div className="mt-7 space-y-5">
        <div>
          <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
            Ayushman Bharat Digital Mission ecosystem
            <span className="h-px flex-1 bg-brand/15" />
          </h3>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ABDM_ECOSYSTEM.map((item) => (
              <IntegrationCard key={item.name} item={item} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
            Government & public services
            <span className="h-px flex-1 bg-brand/15" />
          </h3>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GOVERNMENT_SERVICES.map((item) => (
              <IntegrationCard key={item.name} item={item} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
            Indian private technology
            <span className="h-px flex-1 bg-line" />
          </h3>
          <p className="mt-1 text-[11px] leading-4 text-ink-400">
            Used for platform features only — not a Government of India integration.
          </p>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRIVATE_TECH.map((item) => (
              <IntegrationCard key={item.name} item={item} />
            ))}
          </div>
        </div>
      </div>

      <IntegrationScale />

      <p className="mt-4 text-center text-[10px] text-ink-400">
        Government logos are used for identification only. Demo environments simulate integrations —
        live connectivity requires onboarding through the respective government programme.
      </p>
    </section>
  );
}