import { env } from '../../config/env';
import logger from '../../config/logger';
import { PlaceSearchResult, GeoPoint } from '../maps/types';

/**
 * Mappls (MapMyIndia) — Indian maps + location intelligence. Provides
 * geocoding, place search and routing. Adapter returns unavailable when not
 * configured.
 */
export interface MapplsProvider {
  placeSearch(query: string, center?: GeoPoint): Promise<PlaceSearchResult>;
  geocode(query: string): Promise<GeoPoint | undefined>;
}

export function createMapplsProvider(): MapplsProvider {
  const { MAPPLS_API_BASE_URL, MAPPLS_API_KEY } = env;

  async function placeSearch(query: string, center?: GeoPoint): Promise<PlaceSearchResult> {
    if (!MAPPLS_API_BASE_URL || !MAPPLS_API_KEY) {
      return { source: 'mappls', available: false, provided: false, items: [] };
    }
    try {
      const url = new URL(`${MAPPLS_API_BASE_URL.replace(/\/$/, '')}/api/places/search/json`);
      url.searchParams.set('query', query);
      url.searchParams.set('key', MAPPLS_API_KEY);
      if (center) {
        url.searchParams.set('location', `${center.lat},${center.lng}`);
      }
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return { source: 'mappls', available: false, provided: false, items: [] };
      const data = (await res.json()) as { suggestedLocations?: Array<{ placeAddress?: string; longitude?: string; latitude?: string }> };
      const rows = Array.isArray(data.suggestedLocations) ? data.suggestedLocations : [];
      const items = rows.map((r) => ({
        name: String(r.placeAddress || 'Place'),
        point: r.latitude && r.longitude ? { lat: Number(r.latitude), lng: Number(r.longitude) } : undefined,
      }));
      return { source: 'mappls', available: true, provided: true, items, geocoded: items[0]?.point };
    } catch (err) {
      logger.warn({ err }, 'Mappls search failed');
      return { source: 'mappls', available: false, provided: false, items: [] };
    }
  }

  async function geocode(query: string): Promise<GeoPoint | undefined> {
    const result = await placeSearch(query);
    return result.geocoded;
  }

  return { placeSearch, geocode };
}
