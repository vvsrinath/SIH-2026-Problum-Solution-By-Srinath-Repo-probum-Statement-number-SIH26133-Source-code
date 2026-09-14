import { createMapplsProvider } from '../../integrations/mappls/mappls.provider';
import { bhuvanSearch } from '../../integrations/bhuvan/bhuvan.provider';
import { HospitalRef, GeoPoint } from '../../integrations/maps/types';
import { Hospital } from '../../database/models/Hospital';
import { nanoid } from 'nanoid';

export interface NearbyHospitalsInput {
  lat: number;
  lng: number;
  radiusKm: number;
  type: string;
  language: string;
  requesterUserId: string;
}

function dedupe(items: HospitalRef[]): HospitalRef[] {
  const seen = new Set<string>();
  const out: HospitalRef[] = [];
  for (const item of items) {
    const key = item.name + '|' + (item.address || '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

export async function discoverNearbyHospitals(input: NearbyHospitalsInput) {
  const point: GeoPoint = { lat: input.lat, lng: input.lng };
  const query = 'hospital';
  let items: HospitalRef[] = [];

  const mappls = createMapplsProvider();
  const mapplsResult = await mappls.placeSearch(query, point);
  if (mapplsResult.available && mapplsResult.items.length) {
    items = items.concat(
      mapplsResult.items.map((i) => ({
        name: i.name,
        address: i.address || '',
        type: 'HOSPITAL',
        point: i.point,
        distanceMeters: i.point ? distanceMeters(point, i.point as GeoPoint) : undefined,
        source: 'mappls' as const,
      }))
    );
  }

  const bhuvan = await bhuvanSearch(query + ' health centre', point);
  if (bhuvan.available && bhuvan.items.length) {
    items = items.concat(
      bhuvan.items.map((i) => ({
        name: i.name,
        address: i.address || '',
        type: 'HOSPITAL',
        point: i.point,
        distanceMeters: i.point ? distanceMeters(point, i.point as GeoPoint) : undefined,
        source: 'bhuvan' as const,
      }))
    );
  }

  let deduped = dedupe(items);
  deduped = deduped.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
  const providersActive = mapplsResult.available || bhuvan.available;

  // Persist each discovered facility for audit/reference.
  for (const item of deduped.slice(0, 25)) {
    const sourceRef = `${item.source}:${item.name}:${item.address}`;
    const existing = await Hospital.findOne({ sourceReference: sourceRef }).lean();
    const source: 'BHUVAN' | 'MAPPLS' = item.source === 'bhuvan' ? 'BHUVAN' : 'MAPPLS';
    const patch = {
      name: item.name,
      facilityType: item.type,
      latitude: item.point?.lat ?? null,
      longitude: item.point?.lng ?? null,
      address: { line: item.address },
      source,
      sourceReference: sourceRef,
    };
    if (existing) {
      await Hospital.updateOne({ sourceReference: sourceRef }, { $set: patch });
    } else {
      await Hospital.create({ hospitalId: `hsp_${nanoid(12)}`, ...patch });
    }
  }

  return {
    available: providersActive,
    providers: { mappls: mapplsResult.available, bhuvan: bhuvan.available },
    count: deduped.length,
    hospitals: deduped.slice(0, 25),
  };
}
