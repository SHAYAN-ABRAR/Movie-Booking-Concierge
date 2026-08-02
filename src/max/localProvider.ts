import { runSkill } from './skills';
import { CLARIFY_THRESHOLD, type MaxAssistantProvider, type MaxProviderInput, type MaxReply } from './types';

/**
 * The local provider.
 *
 * This is the only provider that produces application behaviour. Every action,
 * price, showtime and seat suggestion Max offers originates here, from the same
 * seed data and the same pricing functions the rest of the site uses.
 */
export const LocalMaxAssistantProvider: MaxAssistantProvider = {
  id: 'local',
  label: 'On this device',

  async respond({ parse, context, history }: MaxProviderInput): Promise<MaxReply> {
    // Below the threshold Max asks rather than guesses — but only when a
    // clarification would actually change the answer. A confident-enough parse
    // with concrete entities is better answered than interrogated.
    const hasConcreteEntities = parse.readAs.length > 0;
    const shouldClarify =
      parse.confidence < CLARIFY_THRESHOLD && !hasConcreteEntities && parse.intent !== 'greeting';

    if (shouldClarify) {
      return {
        text:
          parse.language === 'bn'
            ? 'ঠিক ধরতে পারিনি। নিচের কোনটি বোঝাতে চেয়েছেন?'
            : "I'm not confident I read that correctly.",
        blocks: [],
        actions: [],
        clarify: {
          question:
            parse.language === 'bn' ? 'কোনটি সবচেয়ে কাছাকাছি?' : 'Which of these did you mean?',
          options: [
            { label: 'Find something to watch', reply: 'What can I watch tonight?' },
            { label: 'Find a showtime', reply: 'Show me screenings after 8pm' },
            { label: 'A question about prices', reply: 'How is a ticket price worked out?' },
            ...(context.booking.showtimeId
              ? [{ label: 'Help me pick seats', reply: 'Find me two seats together' }]
              : []),
          ],
        },
        source: 'local',
      };
    }

    const result = runSkill(parse, context);

    // A follow-up like "and tomorrow?" inherits the previous turn's subject.
    // The skills already read context; history is used only to avoid repeating
    // an identical answer twice in a row.
    const previous = [...history].reverse().find((message) => message.role === 'assistant');
    if (previous && previous.text === result.text && result.blocks.length === 0) {
      return {
        ...result,
        text:
          parse.language === 'bn'
            ? 'এটাই আমার কাছে থাকা তথ্য। অন্যভাবে জিজ্ঞাসা করলে হয়তো আরও সাহায্য করতে পারব।'
            : "That's the same answer as before — I don't have anything further on it. Asking a different way may get further.",
      };
    }

    return result;
  },
};
