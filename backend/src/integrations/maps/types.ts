import { z } from 'zod';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoProviderResult {
  source: 'bhuvan' | 'mappls' | 'none';
  available: boolean;
  items: HospitalRef[];
}

export interface PlaceSearchResult {
  source: 'bhuvan' | 'mappls' | 'none';
  available: boolean;
  provided: boolean;
  geocoded?: GeoPoint;
  items: Array<{ name: string; address?: string; point?: GeoPoint }>;
}

export interface HospitalRef {
  name: string;
  address: string;
  type: string;
  point?: GeoPoint;
  distanceMeters?: number;
  placeId?: string;
  source: 'bhuvan' | 'mappls' | 'none';
}

export const nearbyHospitalsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).default(20),
  type: z.enum(['HOSPITAL', 'CLINIC', 'PHC', 'CHC', 'ALL']).default('ALL'),
});
