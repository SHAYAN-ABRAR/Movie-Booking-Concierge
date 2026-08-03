import { LocalMaxAssistantProvider } from './localProvider';
import type { MaxAssistantProvider, MaxProviderInput, MaxReply } from './types';

/**
 * An optional phrasing layer backed by a locally-running Ollama daemon.
 *
 * What it is allowed to do
 * ------------------------
 * Rewrite the *wording* of a reply the local provider has already produced.
 * Nothing else. The blocks, the actions, the prices, the showtimes and the seat
 * suggestions are all computed locally and passed through untouched, so the
 * model can never invent a price, a screening or an application action.
 *
 * Why it is off by default
 * ------------------------
 * Max is a local assistant. This adapter talks to `http://localhost:11434`,
 * which is the customer's own machine — but a `-cloud` model tag causes that
 * daemon to relay the prompt onward to Ollama's servers. That is a meaningful
 * difference, so the toggle stays off until the customer turns it on, the UI
 * says plainly what gets sent, and the control is only rendered when a daemon
 * is actually reachable. There is no API key, and none is ever requested.
 */

export const OLLAMA_ENDPOINT = 'http://localhost:11434';
export const OLLAMA_MODEL = 'gpt-oss:120b';

/** Probes for a local daemon. Resolves false quickly when nothing is listening. */
export async function detectOllama(timeoutMs = 1200): Promise<{ available: boolean; models: string[] }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${OLLAMA_ENDPOINT}/api/tags`, { signal: controller.signal });
    if (!response.ok) return { available: false, models: [] };
    const data: unknown = await response.json();
    const models =
      typeof data === 'object' && data !== null && Array.isArray((data as { models?: unknown }).models)
        ? ((data as { models: Array<{ name?: string }> }).models
            .map((entry) => entry.name)
            .filter((name): name is string => typeof name === 'string'))
        : [];
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  } finally {
    clearTimeout(timer);
  }
}

const SYSTEM_PROMPT = [
  'You are Max, a cinema booking concierge for GrandPlex.',
  'You will be given a DRAFT reply that has already been computed from local data.',
  'Rewrite the DRAFT so it reads naturally. Obey these rules exactly:',
  '- Keep every number, price, time, date, seat identifier and proper noun byte-for-byte identical.',
  '- Do not add any fact, recommendation, price or availability that is not in the DRAFT.',
  '- Do not add greetings, sign-offs, or offers of further help.',
  '- Do not use the phrases "Great question", "Absolutely", "I\'d be delighted", "As an AI", or "Anything else?".',
  '- Keep it to at most three short sentences.',
  '- Reply in the same language as the DRAFT.',
  'Return only the rewritten text, with no preamble and no quotation marks.',
].join('\n');

/** Strips anything that looks like the model ignoring its brief. */
function sanitise(candidate: string, draft: string): string | null {
  const text = candidate.trim().replace(/^["']|["']$/g, '');
  if (!text) return null;
  if (text.length > draft.length * 2.2 + 120) return null;

  // Every number in the draft must survive verbatim, or we discard the rewrite.
  const draftNumbers = draft.match(/\d[\d,.:]*/g) ?? [];
  for (const number of draftNumbers) {
    if (!text.includes(number)) return null;
  }

  const banned = /great question|absolutely|i'?d be delighted|as an ai|anything else\?/i;
  if (banned.test(text)) return null;

  return text;
}

/**
 * Wraps the local provider. Any failure — daemon down, model missing, slow
 * response, a rewrite that drops a number — falls straight back to the local
 * text, so the customer always gets an answer.
 */
export function createOllamaProvider(model: string = OLLAMA_MODEL): MaxAssistantProvider {
  return {
    id: 'ollama',
    label: `Ollama · ${model}`,

    async respond(input: MaxProviderInput): Promise<MaxReply> {
      const local = await LocalMaxAssistantProvider.respond(input);

      // A clarification is a fixed interaction; rewriting it risks losing the
      // question's precision for no benefit.
      if (local.clarify || !local.text.trim()) return local;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(`${OLLAMA_ENDPOINT}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            stream: false,
            options: { temperature: 0.3, num_predict: 220 },
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `DRAFT:\n${local.text}` },
            ],
          }),
        });

        if (!response.ok) return local;

        const data: unknown = await response.json();
        const content =
          typeof data === 'object' && data !== null
            ? (data as { message?: { content?: unknown } }).message?.content
            : undefined;

        if (typeof content !== 'string') return local;

        const rewritten = sanitise(content, local.text);
        if (!rewritten) return local;

        return { ...local, text: rewritten, source: 'ollama' };
      } catch {
        return local;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
