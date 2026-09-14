import type { SVGProps } from 'react';

/**
 * Locally-bundled government & community healthcare illustrations.
 *
 * These are inline SVGs (no external/network assets) used to evoke Indian
 * government healthcare programmes — ASHA/ANM workers, Primary Health
 * Centres, the 108 ambulance service, and rural connectivity. All artwork is
 * original and illustrative.
 */

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

function base(props: IconProps) {
  return {
    width: props.size ?? 24,
    height: props.size ?? 24,
    viewBox: '0 0 64 64',
    fill: 'none',
    'aria-hidden': true,
    className: props.className,
  };
}

/* Ambulance / 108 emergency service */
export function AmbulanceGov(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="10" y="22" width="34" height="20" rx="3" fill="#E5F2FF" stroke="#2563EB" strokeWidth="2" />
      <path d="M24 22v-6h10v6M24 18h-6v6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" transform="translate(0 0)" />
      <circle cx="22" cy="44" r="4.5" fill="#fff" stroke="#2563EB" strokeWidth="2" />
      <circle cx="36" cy="44" r="4.5" fill="#fff" stroke="#2563EB" strokeWidth="2" />
      <path d="M30 46v-4h4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 44h20" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Primary Health Centre building */
export function PhcGov(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 34 L32 14 L56 34" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="16" y="32" width="32" height="18" rx="2" fill="#CCFBF1" stroke="#0F766E" strokeWidth="2" />
      <rect x="26" y="40" width="12" height="10" fill="#5EEAD4" stroke="#0F766E" strokeWidth="1.5" rx="1" />
      <path d="M12 58h40" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 20l-2 4h-4l4 4-2 4h-4l4 4" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ASHA / ANM health worker */
export function AshaGov(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="32" cy="18" r="8" fill="#FDE68A" stroke="#92400E" strokeWidth="2" />
      <rect x="20" y="28" width="24" height="26" rx="6" fill="#FCA5A5" stroke="#B91C1C" strokeWidth="2" />
      <path d="M26 48h12M27 52h10" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 28l0 26" stroke="#B91C1C" strokeWidth="2" />
      <path d="M28 36c0-4 8-4 8 0" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 30c-3 3-3 8 0 11M42 30c3 3 3 8 0 11" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Village / rural home */
export function VillageGov(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 36h52" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 58h40" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 36V26h8v10" fill="#FDE68A" stroke="#92400E" strokeWidth="2" />
      <path d="M38 36V24h8v12" fill="#D1FAE5" stroke="#92400E" strokeWidth="2" />
      <path d="M15 34h-6M55 34h-6" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
      <circle cx="45" cy="45" r="5" fill="#FCA5A5" stroke="#B91C1C" strokeWidth="2" />
      <path d="M43 45h4M45 43v4" stroke="#B91C1C" strokeWidth="1.5" />
    </svg>
  );
}

/* Digital ABHA / MeriPehchaan identity card */
export function AbhaCardGov(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="8" y="16" width="48" height="32" rx="4" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" />
      <circle cx="22" cy="30" r="6" fill="#E0E7FF" stroke="#4F46E5" strokeWidth="2" />
      <rect x="31" y="24" width="20" height="3" rx="1.5" fill="#C7D2FE" />
      <rect x="31" y="30" width="14" height="3" rx="1.5" fill="#C7D2FE" />
      <path d="M26 42h30" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12h8M48 12h8" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Video consultation (BharatVC) */
export function VideoCareGov(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="8" y="18" width="30" height="24" rx="4" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
      <path d="M38 28l10-6v20l-10-6" fill="#BAE6FD" stroke="#0284C7" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 34h8M20 30v8-4" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Map / geospatial (Bhuvan/Mappls) */
export function MapHealthGov(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 14l12-6 12 6 12-6 8 4v32l-8-4-12 6-12-6-12 6-8-4V14z" fill="#ECFDF5" stroke="#059669" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="30" cy="30" r="6" fill="#6EE7B7" stroke="#059669" strokeWidth="2" />
      <path d="M30 36v8M30 24v2" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Shield / trust & e-Governance */
export function GovernanceGov(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M32 8l18 6v16c0 12-8 20-18 24-10-4-18-12-18-24V14l18-6z" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 30l6 6 10-12" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
