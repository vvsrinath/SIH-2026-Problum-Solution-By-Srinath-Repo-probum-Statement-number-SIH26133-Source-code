import { env } from '../../config/env';
import logger from '../../config/logger';
import { GeoProviderResult, PlaceSearchResult, GeoPoint } from '../maps/types';
import { UnavailableError } from '../../utils/errors';

/**
 * Bhuvan (ISRO/NRSC) — India's national geo-platform. The Node backend
 * proxies discovery requests and normalizes the response. When the service
 * is not configured (no token) we return an explicit unavailable state.
 */
export interface BhuvanProvider {
  searchHealthFacilities(query: string, point?: GeoPoint): Promise<GeoProviderResult>;
  geocode(query: string): Promise<GeoPoint | undefined>;
}

export function createBhuvanProvider(): BhuvanProvider {
  const { BHUVAN_API_BASE_URL, BHUVAN_API_KEY } = env;

  async function searchHealthFacilities(query: string, point?: GeoPoint): Promise<GeoProviderResult> {
    if (!BHUVAN_API_BASE_URL || !BHUVAN_API_KEY) {
      return { source: 'bhuvan', available: false, items: [] };
    }
    try {
      const url = new URL(`${BHUVAN_API_BASE_URL.replace(/\/$/, '')}/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('token', BHUVAN_API_KEY);
      if (point) {
        url.searchParams.set('lon', String(point.lng));
        url.searchParams.set('lat', String(point.lat));
      }
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return { source: 'bhuvan', available: false, items: [] };
      const data = (await res.json()) as { status?: string; data?: Array<Record<string, unknown>> };
      const rows = Array.isArray(data.data) ? data.data : [];
      const items = rows.map((r) => ({
        name: String(r.name || r.title || 'Unnamed health facility'),
        address: String(r.address || r.district || ''),
        type: String(r.type || r.category || 'HOSPITAL'),
        point: r.lat && r.lon ? { lat: Number(r.lat), lng: Number(r.lon) } : undefined,
        source: 'bhuvan' as const,
      }));
      return { source: 'bhuvan', available: true, items };
    } catch (err) {
      logger.warn({ err }, 'Bhuvan search failed');
      throw new UnavailableError('Location service temporarily unavailable', 'INTEGRATION_UNAVAILABLE');
    }
  }

  async function geocode(query: string): Promise<GeoPoint | undefined> {
    if (!BHUVAN_API_BASE_URL || !BHUVAN_API_KEY) return undefined;
    try {
      const res = await searchHealthFacilities(query);
      return res.items.find((i) => i.point)?.point;
    } catch {
      return undefined;
    }
  }

  return { searchHealthFacilities, geocode };
}

// Mapped into a generic shape for the discovery controller.
export async function bhuvanSearch(
  query: string,
  point: GeoPoint | undefined
): Promise<PlaceSearchResult> {
  const provider = createBhuvanProvider();
  try {
    const geo = await provider.searchHealthFacilities(query, point);
    return {
      source: 'bhuvan',
      available: geo.available,
      provided: geo.available,
      geocoded: undefined,
      items: geo.items.map((i) => ({ name: i.name, address: i.address, point: i.point })),
    };
  } catch (err) {
    return { source: 'bhuvan', available: false, provided: true, items: [] };
  }
}
