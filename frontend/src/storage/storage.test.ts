import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../storage/db';
import type { ChatMessageLocal, ConversationLocal, Draft } from '../storage/schema';
import {
  storeChatMessage,
  getConversationMessages,
  updateMessageStatus,
  getPendingMessages,
  upsertConversation,
  getConversations,
  clearUserChatData,
} from '../storage/repositories/chatRepository';
import {
  saveDraft,
  getDraft,
  getDraftById,
  clearUserDrafts,
} from '../storage/repositories/draftRepository';
import {
  putFacility,
  getCachedFacility,
  getCachedFacilities,
  isExpired,
  clearUserCaches,
} from '../storage/repositories/cacheRepository';
import { setPreference, getPreference, clearUserPreferences } from '../storage/repositories/preferencesRepository';
import { enqueue, getPending, markDone, markFailed, getQueueStats } from '../storage/repositories/syncRepository';

function chatMsg(partial: Partial<ChatMessageLocal>): ChatMessageLocal {
  return {
    id: 'm-1',
    ownerUserId: 'user-a',
    conversationId: 'conv-1',
    senderId: 'user-a',
    ciphertext: 'base64-cipher',
    iv: 'base64-iv',
    protocolVersion: '1.0',
    timestamp: new Date().toISOString(),
    status: 'pending',
    localId: 'local-1',
    ...partial,
  };
}

beforeEach(async () => {
  await db.chatMessages.clear();
  await db.conversations.clear();
  await db.drafts.clear();
  await db.cachedFacilities.clear();
  await db.cachedProviders.clear();
  await db.syncQueue.clear();
  await db.offlineActions.clear();
  await db.preferences.clear();
  await db.pendingBooking.clear();
});

describe('IndexedDB chat repository', () => {
  it('stores and retrieves messages per conversation', async () => {
    await storeChatMessage(chatMsg({ id: 'm-1', timestamp: '2026-01-01T00:00:00Z' }));
    await storeChatMessage(chatMsg({ id: 'm-2', timestamp: '2026-01-01T00:01:00Z' }));

    const msgs = await getConversationMessages('user-a', 'conv-1');
    expect(msgs.map((m) => m.id)).toEqual(['m-1', 'm-2']);
  });

  it('isolates messages by ownerUserId', async () => {
    await storeChatMessage(chatMsg({ id: 'm-1', ownerUserId: 'user-a', conversationId: 'conv-1' }));
    await storeChatMessage(chatMsg({ id: 'm-2', ownerUserId: 'user-b', conversationId: 'conv-1' }));

    const a = await getConversationMessages('user-a', 'conv-1');
    expect(a.map((m) => m.id)).toEqual(['m-1']);
  });

  it('updates delivery status', async () => {
    await storeChatMessage(chatMsg({ id: 'm-1', status: 'pending' }));
    await updateMessageStatus('m-1', 'delivered');
    const msgs = await getConversationMessages('user-a', 'conv-1');
    expect(msgs[0].status).toBe('delivered');
  });

  it('returns only pending/failed as pending-outbound', async () => {
    await storeChatMessage(chatMsg({ id: 'm-1', ownerUserId: 'user-a', status: 'pending' }));
    await storeChatMessage(chatMsg({ id: 'm-2', ownerUserId: 'user-a', status: 'sent' }));
    const pending = await getPendingMessages('user-a');
    expect(pending.map((m) => m.id)).toEqual(['m-1']);
  });

  it('clearUserChatData removes only the user’s rows', async () => {
    await storeChatMessage(chatMsg({ id: 'm-1', ownerUserId: 'user-a', status: 'sent' }));
    await storeChatMessage(chatMsg({ id: 'm-2', ownerUserId: 'user-b', status: 'sent' }));
    await upsertConversation({
      id: 'conv-1',
      ownerUserId: 'user-a',
      peerUserId: 'user-b',
      lastMessageAt: '2026-01-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
    } as ConversationLocal);

    await clearUserChatData('user-a');

    const remainingA = await getConversationMessages('user-a', 'conv-1');
    const remainingB = await getConversationMessages('user-b', 'conv-1');
    expect(remainingA).toHaveLength(0);
    expect(remainingB).toHaveLength(1);
    expect(await getConversations('user-a')).toHaveLength(0);
  });
});

describe('Draft repository', () => {
  it('saves and reloads a draft by owner+kind', async () => {
    const draft: Draft = {
      id: 'd-1',
      ownerUserId: 'user-a',
      kind: 'booking',
      payload: { doctorId: 'doc-1' },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    await saveDraft(draft);
    const loaded = await getDraft('user-a', 'booking');
    expect(loaded?.id).toBe('d-1');
  });

  it('does not leak another user’s draft', async () => {
    await saveDraft({ id: 'd-1', ownerUserId: 'user-b', kind: 'booking', payload: {}, createdAt: '', updatedAt: '' });
    expect(await getDraft('user-a', 'booking')).toBeNull();
  });

  it('clears drafts for a user on logout', async () => {
    await saveDraft({ id: 'd-1', ownerUserId: 'user-a', kind: 'note', payload: {}, createdAt: '', updatedAt: '' });
    await clearUserDrafts('user-a');
    expect(await getDraftById('d-1')).toBeNull();
  });
});

describe('Facility cache with TTL', () => {
  it('stores facilities and reports cached values', async () => {
    await putFacility({
      id: 'f-1',
      facilityId: 'fac-1',
      name: 'District Hospital',
      type: 'HOSPITAL',
      region: 'North',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      expiresAt: new Date(Date.now() + 100000).toISOString(),
      version: 1,
    });
    const all = await getCachedFacilities();
    expect(all).toHaveLength(1);
    const one = await getCachedFacility('fac-1');
    expect(one?.name).toBe('District Hospital');
  });

  it('flags cached data as expired when TTL passes', async () => {
    await putFacility({
      id: 'f-1',
      facilityId: 'fac-1',
      name: 'Old',
      type: 'HOSPITAL',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      version: 1,
    });
    const cached = await getCachedFacility('fac-1');
    expect(cached).toBeTruthy();
    expect(isExpired(cached!)).toBe(true);
  });

  it('clears cached searches on logout', async () => {
    await putFacility({
      id: 'f-1',
      facilityId: 'fac-1',
      name: 'X',
      type: 'CENTER',
      createdAt: '',
      updatedAt: '',
      expiresAt: new Date(Date.now() + 1000).toISOString(),
      version: 1,
    });
    await clearUserCaches();
    expect(await getCachedFacilities()).toHaveLength(0);
  });
});

describe('Preferences (local fallback)', () => {
  it('round-trips a preference', async () => {
    await setPreference('lang', 'user-a', 'hi');
    expect((await getPreference('lang'))?.value).toEqual('hi');
  });

  it('clears preferences for a user on logout', async () => {
    await setPreference('lang', 'user-a', 'hi');
    await clearUserPreferences('user-a');
    expect(await getPreference('lang')).toBeNull();
  });
});

describe('Sync queue repository', () => {
  it('enqueues with an idempotency key', async () => {
    const item = await enqueue({ type: 'appointmentCreate', entity: 'appointments', payload: { d: 1 } });
    expect(item).not.toBeNull();
    expect(item!.id).toBe(item!.idempotencyKey);
    const pending = await getPending();
    expect(pending).toHaveLength(1);
  });

  it('moves processed items to done and fails after retries', async () => {
    const item = await enqueue({ type: 'appointmentCreate', entity: 'appointments', payload: {} });
    const id = item!.id;

    await markDone(id);
    let stats = await getQueueStats();
    expect(stats.done).toBe(1);
    expect(stats.pending).toBe(0);

    const item2 = await enqueue({ type: 'referralCreate', entity: 'referrals', payload: {} });
    for (let i = 0; i < 5; i++) await markFailed(item2!.id, 'http-500');
    stats = await getQueueStats();
    expect(stats.failed).toBe(1);
  });
});
