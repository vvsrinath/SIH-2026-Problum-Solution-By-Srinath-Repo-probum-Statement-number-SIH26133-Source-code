/**
 * Cache repository — read-only local copies of server data with TTL expiry.
 * Cached data is NEVER authoritative when freshness matters.
 */

import { db, isIdbAvailable } from '../db';
import type { CachedFacility, CachedProvider } from '../schema';

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

function makeExpiry(ttlMs: number): string {
  return new Date(Date.now() + ttlMs).toISOString();
}

export async function putFacility(facility: Partial<CachedFacility> & { facilityId: string }): Promise<void> {
  if (!isIdbAvailable()) return;
  const id = facility.id || facility.facilityId;
  const now = new Date().toISOString();
  await db.cachedFacilities.put({
    id,
    facilityId: facility.facilityId,
    name: facility.name || '',
    type: facility.type || '',
    region: facility.region,
    district: facility.district,
    latitude: facility.latitude,
    longitude: facility.longitude,
    createdAt: facility.createdAt || now,
    updatedAt: now,
    expiresAt: facility.expiresAt || makeExpiry(DEFAULT_TTL_MS),
    version: (facility.version ?? 0) + 1,
  });
}

export async function putFacilities(facilities: Array<Partial<CachedFacility> & { facilityId: string }>): Promise<void> {
  for (const f of facilities) await putFacility(f);
}

export async function getCachedFacility(facilityId: string): Promise<CachedFacility | null> {
  if (!isIdbAvailable()) return null;
  const rec = await db.cachedFacilities.where('facilityId').equals(facilityId).first();
  return rec ?? null;
}

export async function getCachedFacilities(): Promise<CachedFacility[]> {
  if (!isIdbAvailable()) return [];
  return db.cachedFacilities.toArray();
}

export function isExpired(ent: { expiresAt: string }): boolean {
  return new Date(ent.expiresAt).getTime() <= Date.now();
}

export async function putProvider(provider: Partial<CachedProvider> & { providerId: string }): Promise<void> {
  if (!isIdbAvailable()) return;
  const id = provider.id || provider.providerId;
  const now = new Date().toISOString();
  await db.cachedProviders.put({
    id,
    providerId: provider.providerId,
    name: provider.name || '',
    specialization: provider.specialization || '',
    facilityName: provider.facilityName,
    createdAt: provider.createdAt || now,
    updatedAt: now,
    expiresAt: provider.expiresAt || makeExpiry(DEFAULT_TTL_MS),
    version: (provider.version ?? 0) + 1,
  });
}

export async function getCachedProviders(): Promise<CachedProvider[]> {
  if (!isIdbAvailable()) return [];
  return db.cachedProviders.toArray();
}

export async function clearUserCaches(): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.cachedFacilities.clear();
  await db.cachedProviders.clear();
  await db.cachedHealthcareData.clear();
}

export { DEFAULT_TTL_MS };
