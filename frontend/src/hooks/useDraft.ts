/**
 * useDraft — access local drafts (chat, booking form, notes).
 * LOCAL_ONLY + NEVER_SYNC.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  saveDraft,
  getDraft,
  getDraftById,
  deleteDraft,
} from '../storage/repositories/draftRepository';
import type { Draft } from '../storage/schema';
import { randomId } from '../storage/encryption/crypto';

export function useDraft(ownerUserId: string | undefined, kind: string) {
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    if (!ownerUserId) return;
    setDraft(await getDraft(ownerUserId, kind));
  }, [ownerUserId, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (payload: unknown, id?: string) => {
      if (!ownerUserId) return null;
      const record: Draft = {
        id: id || draft?.id || randomId('draft'),
        ownerUserId,
        kind,
        payload,
        createdAt: draft?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveDraft(record);
      setDraft(record);
      return record;
    },
    [ownerUserId, kind, draft],
  );

  const clear = useCallback(async () => {
    if (draft?.id) await deleteDraft(draft.id);
    setDraft(null);
  }, [draft]);

  const loadById = useCallback(async (id: string) => {
    const d = await getDraftById(id);
    setDraft(d);
    return d;
  }, []);

  return { draft, save, clear, load, loadById };
}
