/**
 * useCachedFacilities — access cached facility/provider data with TTL.
 * Cached data is never authoritative for fresh availability.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getCachedFacilities,
  getCachedFacility,
  isExpired,
} from '../storage/repositories/cacheRepository';
import type { CachedFacility } from '../storage/schema';

export interface FacilityView {
  facility: CachedFacility;
  stale: boolean;
}

export function useCachedFacilities() {
  const [facilities, setFacilities] = useState<CachedFacility[]>([]);

  const loadAll = useCallback(async () => {
    setFacilities(await getCachedFacilities());
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const getById = useCallback(
    async (facilityId: string): Promise<FacilityView | null> => {
      const facility = await getCachedFacility(facilityId);
      if (!facility) return null;
      return { facility, stale: isExpired(facility) };
    },
    [],
  );

  return {
    facilities,
    loadAll,
    getById,
    isStale: isExpired,
  };
}
