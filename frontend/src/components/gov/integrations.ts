import type { ComponentType, SVGProps } from 'react';

/**
 * Accurate Government of India / public-ecosystem integration map.
 *
 * Sources:
 * - ABDM (ABHA, HPR, HFR, UHI) — official digital-health ecosystem components.
 * - MeriPehchaan — government National Single Sign-On (NSSO).
 * - NMC — statutory body under MoHFW maintaining the National Medical Register.
 * - Bhuvan — Indian Geo-Platform of ISRO/NRSC.
 * - BharatVC — government conferencing service (sign-in via Parichay SSO).
 * - GovDrive — NIC cloud storage (uses Parichay SSO, NOT MeriPehchaan).
 * - Mappls — Indian PRIVATE technology, not a Government of India integration.
 *
 * Logos in /images/gov/ are fetched from each service's official site or
 * Google Play listing (MeriPehchaan, ABHA, BharatVC, GovDrive, NMC, Bhuvan,
 * Mappls) and used for identification only.
 */

export type IntegrationStatus = 'ready' | 'planned' | 'future' | 'verification';

interface IntegrationVisual {
  /** Bundled official logo path (e.g. ABDM, ISRO). */
  logo?: string;
  /** Illustrative fallback glyph when no official logo is bundled. */
  icon?: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
}

export interface GovernmentIntegration extends IntegrationVisual {
  name: string;
  detail: string;
  status: IntegrationStatus;
  dependency: string;
}

/** Status pill labels shown in the UI. */
export const STATUS_LABEL: Record<IntegrationStatus, string> = {
  ready: 'Integration-ready',
  planned: 'Planned',
  future: 'Future',
  verification: 'Verification source',
};

/** ABDM — the national digital-health ecosystem (umbrella). */
export const ABDM_ECOSYSTEM: GovernmentIntegration[] = [
  {
    name: 'ABDM',
    detail: 'Ayushman Bharat Digital Mission — overall digital-health ecosystem and interoperability direction.',
    status: 'ready',
    dependency: 'authorization-dependent',
    logo: '/images/gov/ayushman-bharat.svg',
  },
  {
    name: 'ABHA',
    detail: 'Ayushman Bharat Health Account — patient health identity and linking health records.',
    status: 'planned',
    dependency: 'authorization-dependent',
    logo: '/images/gov/abha.jpg',
  },
  {
    name: 'HPR',
    detail: 'Healthcare Professionals Registry — doctor and professional verification.',
    status: 'planned',
    dependency: 'authorization-dependent',
  },
  {
    name: 'HFR',
    detail: 'Health Facility Registry — hospital, PHC, clinic and facility verification/discovery.',
    status: 'planned',
    dependency: 'authorization-dependent',
  },
  {
    name: 'UHI',
    detail: 'Unified Health Interface — future interoperable appointment, teleconsultation and health-service exchange.',
    status: 'future',
    dependency: 'authorization-dependent',
  },
];

/** Government & public services beyond ABDM. */
export const GOVERNMENT_SERVICES: GovernmentIntegration[] = [
  {
    name: 'MeriPehchaan',
    detail: 'National Single Sign-On (NSSO) — government-oriented authentication and identity direction.',
    status: 'ready',
    dependency: 'authorization-dependent',
    logo: '/images/gov/meripehchaan.png',
  },
  {
    name: 'NMC / National Medical Register',
    detail: 'NMC (MoHFW statutory body) — medical-professional verification reference.',
    status: 'verification',
    dependency: 'access-dependent',
    logo: '/images/gov/nmc.jpg',
  },
  {
    name: 'Bhuvan',
    detail: 'Indian Geo-Platform of ISRO/NRSC — healthcare location and geospatial discovery.',
    status: 'planned',
    dependency: 'integration-dependent',
    logo: '/images/gov/bhuvan.png',
  },
  {
    name: 'BharatVC',
    detail: 'Online video-consultation workflow for government services.',
    status: 'ready',
    dependency: 'integration-dependent',
    logo: '/images/gov/bharatvc.png',
  },
  {
    name: 'GovDrive',
    detail: 'NIC government cloud-storage / collaboration (uses Parichay SSO, not MeriPehchaan).',
    status: 'future',
    dependency: 'authorization-dependent',
    logo: '/images/gov/govdrive.png',
  },
];

/** Indian private technology used by the platform (NOT a Government integration). */
export const PRIVATE_TECH: GovernmentIntegration[] = [
  {
    name: 'Mappls',
    detail: 'Indian private maps, search, geocoding, routes and facility-location technology.',
    status: 'planned',
    dependency: 'integration-dependent',
    logo: '/images/gov/mappls.jpg',
  },
];