import { useCallback, useEffect, useRef, useState } from 'react';
import { CornerDownLeft, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { Switch } from '@/components/ui/toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay';
import { MaxMark } from '@/components/brand/Logo';
import { MaxBlocks } from './blocks';
import { useMax } from '@/store/max';
import { useMaxContext, suggestedPrompts } from '@/max/context';
import { useMaxExecutor, type ActionResult } from '@/max/executor';
import { parse } from '@/max/nlu';
import { LocalMaxAssistantProvider } from '@/max/localProvider';
import { createOllamaProvider, detectOllama, OLLAMA_MODEL } from '@/max/ollamaProvider';
import type { MaxAction, MaxMessage } from '@/max/types';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

/**
 * Max's conversation surface.
 *
 * Replies are typed structures, not markup: `MaxBlocks` renders them. Actions
 * are typed objects executed by `useMaxExecutor`. Anything that would change a
 * booking asks first, and anything that changed offers a way back.
 */

interface PendingConfirmation {
  action: Extract<MaxAction, { confirm: unknown }>;
}

export function MaxPanel({ onClose, headingId }: { onClose: () => void; headingId: string }) {
  const { t } = useTranslation();
  const messages = useMax((s) => s.messages);
  const status = useMax((s) => s.status);
  const push = useMax((s) => s.push);
  const setStatus = useMax((s) => s.setStatus);
  const clearConversation = useMax((s) => s.clearConversation);
  const useOllama = useMax((s) => s.useOllama);
  const setUseOllama = useMax((s) => s.setOllama);
  const ollamaAvailable = useMax((s) => s.ollamaAvailable);
  const setOllamaAvailability = useMax((s) => s.setOllamaAvailability);

  const context = useMaxContext();
  const execute = useMaxExecutor();

  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [undoOffer, setUndoOffer] = useState<ActionResult['undo'] | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  /* ── Probe for a local Ollama daemon, once ────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    detectOllama().then((result) => {
      if (!cancelled) setOllamaAvailability(result.available, result.models);
    });
    return () => {
      cancelled = true;
    };
  }, [setOllamaAvailability]);

  /* ── Focus the composer when the panel opens ──────────────────────── */
  useEffect(() => {
    const timer = window.setTimeout(() => composerRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, []);

  /* ── Keep the newest message in view ──────────────────────────────── */
  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, status]);

  const announce = useCallback((text: string) => {
    if (liveRef.current) liveRef.current.textContent = text;
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || status === 'thinking') return;

      push({ role: 'user', text });
      setDraft('');
      setUndoOffer(null);
      setStatus('thinking');

      const parsed = parse(text, new Date());
      const provider =
        useOllama && ollamaAvailable ? createOllamaProvider(OLLAMA_MODEL) : LocalMaxAssistantProvider;

      try {
        const result = await provider.respond({
          parse: parsed,
          context,
          history: useMax.getState().messages,
        });

        push({
          role: 'assistant',
          text: result.text,
          blocks: result.blocks,
          actions: result.actions,
          ...(result.clarify ? { clarify: result.clarify } : {}),
          source: result.source,
        });
        announce(result.text);
      } catch {
        push({
          role: 'assistant',
          text: 'Something went wrong working that out. Try asking a different way — nothing in your booking has changed.',
          source: 'local',
        });
      } finally {
        setStatus('idle');
      }
    },
    [status, push, setStatus, useOllama, ollamaAvailable, context, announce],
  );

  const run = useCallback(
    async (action: MaxAction) => {
      if ('confirm' in action && action.confirm) {
        setPending({ action: action as PendingConfirmation['action'] });
        return;
      }
      const result = await execute(action);
      setUndoOffer(result.undo ?? null);
      push({ role: 'assistant', text: result.message, source: 'local' });
      announce(result.message);
    },
    [execute, push, announce],
  );

  const prompts = suggestedPrompts(context);

  return (
    <>
      <div className="flex h-full flex-col bg-surface">
        {/* ── Header ────────────────────────────────────────────── */}
        <header className="flex items-start gap-3 border-b border-hairline px-4 py-3">
          <MaxMark className="mt-0.5 size-7 text-base" />
          <div className="min-w-0 flex-1">
            <h2 id={headingId} className="font-display text-lg leading-none">
              Max
            </h2>
            <p className="mt-1 text-[0.75rem] leading-4 text-content-muted">
              {t('maxPanel.role')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowSettings((value) => !value)}
            aria-expanded={showSettings}
            aria-label={t('maxPanel.settings')}
            className="text-[0.6875rem] font-semibold"
          >
            ?
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t('maxPanel.close')}>
            <X aria-hidden="true" />
          </Button>
        </header>

        {/* ── Settings / privacy ────────────────────────────────── */}
        {showSettings ? (
          <div className="border-b border-hairline bg-surface-sunken/50 px-4 py-3 text-[0.8125rem] leading-5">
            <p className="text-content-muted">{t('maxPanel.privacy')}</p>

            {ollamaAvailable ? (
              <div className="mt-3 border-t border-hairline pt-3">
                <label className="flex items-start gap-3">
                  <Switch
                    checked={useOllama}
                    onCheckedChange={setUseOllama}
                    aria-label={`Use the local Ollama model ${OLLAMA_MODEL} to reword replies`}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-content">
                      {t('maxPanel.rewordLabel', { model: OLLAMA_MODEL })}
                    </span>
                    <span className="mt-0.5 block text-content-muted">{t('maxPanel.ollamaOn')}</span>
                  </span>
                </label>
              </div>
            ) : (
              <p className="mt-3 border-t border-hairline pt-3 text-content-faint">
                {t('maxPanel.ollamaOff')}
              </p>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="mt-3 px-0 text-danger"
              onClick={() => {
                clearConversation();
                setUndoOffer(null);
                announce(t('maxPanel.conversationCleared'));
              }}
            >
              <Trash2 aria-hidden="true" />
              {t('maxPanel.clearConversation')}
            </Button>
          </div>
        ) : null}

        {/* ── Transcript ────────────────────────────────────────── */}
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          role="log"
          aria-label={t('maxPanel.conversation')}
        >
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-[0.9375rem] leading-6 text-content">{t('maxPanel.intro')}</p>
              <p className="text-[0.75rem] leading-5 text-content-faint">
                {t('maxPanel.introNote')}
              </p>
            </div>
          ) : (
            <ul className="space-y-5">
              {messages.map((message) => (
                <li key={message.id}>
                  <MessageBubble message={message} onAction={run} onSend={send} />
                </li>
              ))}
            </ul>
          )}

          {status === 'thinking' ? (
            <p className="mt-4 flex items-center gap-2 text-[0.8125rem] text-content-muted">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              {t('maxPanel.thinking')}
            </p>
          ) : null}

          {undoOffer ? (
            <div className="mt-4 flex items-center justify-between gap-3 border border-hairline-strong bg-surface-sunken/60 p-2.5">
              <p className="text-[0.8125rem] text-content-muted">{t('maxPanel.canUndo')}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  undoOffer.run();
                  setUndoOffer(null);
                  push({ role: 'assistant', text: t('maxPanel.undone'), source: 'local' });
                  announce(t('maxPanel.undone'));
                }}
              >
                {undoOffer.label}
              </Button>
            </div>
          ) : null}
        </div>

        {/* ── Quick prompts ─────────────────────────────────────── */}
        <div className="border-t border-hairline px-4 py-2.5">
          <p className="sr-only" id="max-prompts-label">
            {t('maxPanel.suggestedQuestions')}
          </p>
          <ul aria-labelledby="max-prompts-label" className="flex gap-1.5 overflow-x-auto pb-1">
            {prompts.map((prompt) => (
              <li key={prompt} className="shrink-0">
                <button
                  type="button"
                  onClick={() => send(prompt)}
                  disabled={status === 'thinking'}
                  className="whitespace-nowrap border border-hairline-strong px-2.5 py-1.5 text-[0.75rem] transition-colors hover:border-content hover:bg-content/[0.06] disabled:opacity-50"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Composer ──────────────────────────────────────────── */}
        <form
          className="border-t border-hairline px-4 pb-[max(0.75rem,var(--safe-b))] pt-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <label htmlFor="max-composer" className="sr-only">
            {t('maxPanel.askLabel')}
          </label>
          <div className="flex items-end gap-2">
            <Textarea
              id="max-composer"
              ref={composerRef}
              rows={1}
              value={draft}
              placeholder={t('maxPanel.placeholder')}
              className="max-h-28 min-h-11 resize-none py-2.5"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || status === 'thinking'}
              aria-label={t('maxPanel.send')}
            >
              <CornerDownLeft aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-1.5 text-[0.6875rem] leading-4 text-content-faint">
            {t('maxPanel.composerHint')}
          </p>
        </form>

        <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      </div>

      {/* ── Confirmation ──────────────────────────────────────── */}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent className="max-w-md">
          {pending ? (
            <>
              <DialogHeader>
                <DialogTitle>{pending.action.confirm.title}</DialogTitle>
                <DialogDescription>{pending.action.confirm.body}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPending(null)}>
                  {pending.action.confirm.cancelLabel}
                </Button>
                <Button
                  onClick={async () => {
                    const action = pending.action;
                    setPending(null);
                    const result = await execute(action);
                    setUndoOffer(result.undo ?? null);
                    push({ role: 'assistant', text: result.message, source: 'local' });
                    announce(result.message);
                  }}
                >
                  {pending.action.confirm.confirmLabel}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function MessageBubble({
  message,
  onAction,
  onSend,
}: {
  message: MaxMessage;
  onAction: (action: MaxAction) => void;
  onSend: (text: string) => void;
}) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';

  return (
    <div className={cn(isUser ? 'pl-8' : '')}>
      {/* "Max" is the concierge's name and stays as-is; "You" is a role label. */}
      <p className="eyebrow mb-1.5">{isUser ? t('maxPanel.you') : 'Max'}</p>

      <div
        className={cn(
          'text-[0.9375rem] leading-6',
          isUser ? 'border-l-2 border-content pl-3 text-content-muted' : 'text-content',
        )}
      >
        <p>{message.text}</p>
      </div>

      {message.blocks?.length ? (
        <div className="mt-3">
          <MaxBlocks blocks={message.blocks} />
        </div>
      ) : null}

      {message.clarify ? (
        <div className="mt-3">
          <p className="mb-2 text-[0.8125rem] font-semibold">{message.clarify.question}</p>
          <ul className="flex flex-wrap gap-1.5">
            {message.clarify.options.map((option) => (
              <li key={option.label}>
                <button
                  type="button"
                  onClick={() => onSend(option.reply)}
                  className="border border-hairline-strong px-2.5 py-1.5 text-[0.8125rem] transition-colors hover:border-content hover:bg-content/[0.06]"
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message.actions?.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {message.actions.map((action) => (
            <li key={action.label}>
              <Button size="sm" variant="outline" onClick={() => onAction(action)}>
                {action.label}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {message.source === 'ollama' ? (
        <p className="mt-2 text-[0.6875rem] text-content-faint">
          {t('maxPanel.rewordedNote')}
        </p>
      ) : null}
    </div>
  );
}
