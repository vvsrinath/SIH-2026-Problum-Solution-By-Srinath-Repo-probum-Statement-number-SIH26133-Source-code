import { useEffect, useRef, useState } from 'react';
import { MessageSquareIcon, SendIcon, PhoneIcon, SearchIcon } from 'lucide-react';
import { Panel } from '../../components/common/Panel';
import { Avatar } from '../../components/common/Avatar';
import { useToast } from '../../components/common/Toast';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { useAsync } from '../../hooks/useAsync';
import { cn } from '../../utils/cn';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
} from '../../api/workspaces';
import type { ChatMessage, ConversationSummary } from '../../types/workspaces';

const ROLE_LABEL: Record<ConversationSummary['peerRole'], string> = {
  DOCTOR: 'Doctor',
  PATIENT: 'Patient',
  HEALTH_WORKER: 'Health Worker',
  ADMIN: 'Administrator',
  PHC: 'Health Centre',
};

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function MessagesPage() {
  const { toast } = useToast();
  const { data: conversations, loading, error, reload } = useAsync(() => fetchConversations(), []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const list = (conversations ?? []).filter((c) =>
    c.peerName.toLowerCase().includes(query.trim().toLowerCase())
  );

  const active = list.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  useEffect(() => {
    if (!activeId) return;
    let activeCall = true;
    fetchMessages(activeId)
      .then((msgs) => activeCall && setThread(msgs))
      .catch(() => activeCall && setThread([]));
    return () => {
      activeCall = false;
    };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread.length, activeId]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || !active || sending) return;
    setSending(true);
    try {
      const sent = await sendMessage(active.id, text);
      setThread((prev) => [...prev, sent]);
      setDraft('');
      toast('Message sent');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-semibold tracking-[-0.01em] text-navy">Messages</h1>
        <p className="mt-0.5 text-2xs text-ink-500">
          Secure conversations between you and the care team.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <Panel title="Conversations" subtitle="Recent chats with your care team" className="h-full">
          <div className="relative mb-2">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              className="h-8 w-full rounded-chip border border-line bg-white pl-8 pr-3 text-xs text-navy placeholder:text-ink-400 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
          </div>

          {loading && <LoadingState rows={3} label="Loading conversations" />}
          {!loading && error && (
            <ErrorState title="Couldn't load messages" detail={error.message} onRetry={reload} />
          )}
          {!loading && !error && list.length === 0 && (
            <EmptyState
              icon={<MessageSquareIcon className="h-4 w-4" />}
              title="No conversations"
              description="Messages from your doctors and health workers will appear here."
            />
          )}

          <div className="space-y-1.5">
            {!loading && !error && list.map((convo) => (
              <button
                key={convo.id}
                type="button"
                onClick={() => setActiveId(convo.id)}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-card border px-2.5 py-2 text-left transition-colors',
                  activeId === convo.id
                    ? 'border-brand/40 bg-brand-tint2'
                    : 'border-line bg-white hover:border-brand/25'
                )}
              >
                <span className="relative mt-0.5 shrink-0">
                  <Avatar name={convo.peerName} size="md" />
                  {convo.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-navy">{convo.peerName}</span>
                    <span className="shrink-0 text-2xs text-ink-400">{timeLabel(convo.lastAt)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-2xs text-ink-500">{convo.lastMessage}</span>
                    {convo.unread > 0 && (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-2xs font-semibold text-white">
                        {convo.unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={active ? active.peerName : 'Select a conversation'} subtitle={active ? ROLE_LABEL[active.peerRole] : undefined} className="h-full">
          {!active ? (
            <EmptyState
              icon={<MessageSquareIcon className="h-4 w-4" />}
              title="No conversation selected"
              description="Choose a conversation from the list to start reading messages."
            />
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between rounded-card border border-line bg-brand-tint2 px-2.5 py-1.5">
                <span className="flex items-center gap-1.5 text-2xs text-navy">
                  <PhoneIcon className="h-3 w-3 text-brand" />
                  {active.online ? 'Available' : 'Last seen a while ago'}
                </span>
                <span className="text-2xs text-ink-400">End-to-end encrypted</span>
              </div>

              <div ref={scrollRef} className="max-h-[46vh] space-y-2 overflow-y-auto pr-0.5">
                {thread.map((message) => (
                  <div
                    key={message.id}
                    className={cn('flex', message.sender === 'me' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[78%] rounded-2xl px-3 py-2 text-2xs leading-5',
                        message.sender === 'me'
                          ? 'rounded-br-sm bg-brand text-white'
                          : 'rounded-bl-sm border border-line bg-white text-navy'
                      )}
                    >
                      <p>{message.text}</p>
                      <span className={cn('mt-1 block text-right text-2xs', message.sender === 'me' ? 'text-white/70' : 'text-ink-400')}>
                        {timeLabel(message.at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-end gap-2 border-t border-line-soft pt-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Write a message…"
                  rows={1}
                  className="max-h-24 min-h-[38px] flex-1 resize-none rounded-chip border border-line bg-white px-3 py-2 text-xs text-navy placeholder:text-ink-400 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
                <button
                  type="button"
                  disabled={!draft.trim() || sending}
                  onClick={handleSend}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                  aria-label="Send message"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}