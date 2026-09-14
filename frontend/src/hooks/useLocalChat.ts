/**
 * useLocalChat — access the encrypted local chat repository.
 * Messages are ciphertext at rest; decryption happens on display.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  storeChatMessage,
  getConversationMessages,
  updateMessageStatus,
  getPendingMessages,
  upsertConversation,
  getConversations,
  clearUserChatData,
} from '../storage/repositories/chatRepository';
import type { ChatMessageLocal, ConversationLocal } from '../storage/schema';

export function useLocalChat(ownerUserId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessageLocal[]>([]);
  const [conversations, setConversations] = useState<ConversationLocal[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!ownerUserId) return;
    setConversations(await getConversations(ownerUserId));
    const pending = await getPendingMessages(ownerUserId);
    setPendingCount(pending.length);
  }, [ownerUserId]);

  useEffect(() => {
    if (!ownerUserId) return;
    refresh();
  }, [ownerUserId, refresh]);

  const loadConversation = useCallback(
    async (conversationId: string, limit?: number) => {
      if (!ownerUserId) return;
      setMessages(await getConversationMessages(ownerUserId, conversationId, limit));
    },
    [ownerUserId],
  );

  const saveMessage = useCallback(
    async (message: ChatMessageLocal) => {
      await storeChatMessage(message);
      await upsertConversation({
        id: message.conversationId,
        ownerUserId: message.ownerUserId,
        peerUserId: message.senderId === ownerUserId ? message.conversationId : message.senderId,
        lastMessageAt: message.timestamp,
        createdAt: message.timestamp,
      });
      await refresh();
    },
    [ownerUserId, refresh],
  );

  const markStatus = useCallback(async (messageId: string, status: ChatMessageLocal['status']) => {
    await updateMessageStatus(messageId, status);
  }, []);

  const clearAll = useCallback(async () => {
    if (!ownerUserId) return;
    await clearUserChatData(ownerUserId);
    await refresh();
  }, [ownerUserId, refresh]);

  return {
    messages,
    conversations,
    pendingCount,
    loadConversation,
    saveMessage,
    markStatus,
    refresh,
    clearAll,
  };
}
