/**
 * Encrypted chat repository — IndexedDB backed, ciphertext at rest only.
 * Never stores plaintext medical chat.
 */

import { db, isIdbAvailable } from '../db';
import type { ChatMessageLocal, ConversationLocal } from '../schema';

export async function storeChatMessage(message: ChatMessageLocal): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.chatMessages.put(message);
}

export async function getConversationMessages(
  ownerUserId: string,
  conversationId: string,
  limit = 100,
): Promise<ChatMessageLocal[]> {
  if (!isIdbAvailable()) return [];
  return db.chatMessages
    .where('conversationId')
    .equals(conversationId)
    .filter((m) => m.ownerUserId === ownerUserId)
    .sortBy('timestamp')
    .then((all) => all.slice(-limit));
}

export async function updateMessageStatus(
  id: string,
  status: ChatMessageLocal['status'],
): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.chatMessages.update(id, { status });
}

export async function getPendingMessages(ownerUserId: string): Promise<ChatMessageLocal[]> {
  if (!isIdbAvailable()) return [];
  return db.chatMessages
    .where('ownerUserId')
    .equals(ownerUserId)
    .filter((m) => m.status === 'pending' || m.status === 'failed')
    .toArray();
}

export async function upsertConversation(conversation: ConversationLocal): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.conversations.put(conversation);
}

export async function getConversations(ownerUserId: string): Promise<ConversationLocal[]> {
  if (!isIdbAvailable()) return [];
  return db.conversations.where('ownerUserId').equals(ownerUserId).sortBy('lastMessageAt');
}

/**
 * Delete a user's chat data (on logout or key revocation). Accepts a user
 * scope and only removes rows owned by that user.
 */
export async function clearUserChatData(ownerUserId: string): Promise<void> {
  if (!isIdbAvailable()) return;
  await db.chatMessages.where('ownerUserId').equals(ownerUserId).delete();
  await db.conversations.where('ownerUserId').equals(ownerUserId).delete();
}
