import type { ChatMessage, SomaticRatings } from '../types';
import type { Language } from './i18n';

function buildCheckInContext(ratings: Partial<SomaticRatings>, lang: Language): string {
  if (!ratings.energy && !ratings.sleep && !ratings.mood && !ratings.bodyPain) return '';

  const labels = lang === 'rw'
    ? { energy: 'Imbaraga', sleep: 'Itiro', mood: 'Umutima', bodyPain: 'Ububabare' }
    : { energy: 'Energy', sleep: 'Sleep', mood: 'Mood', bodyPain: 'Body Pain' };

  const parts: string[] = [];
  if (ratings.energy !== undefined) parts.push(`${labels.energy}: ${ratings.energy}/5`);
  if (ratings.sleep !== undefined) parts.push(`${labels.sleep}: ${ratings.sleep}/5`);
  if (ratings.mood !== undefined) parts.push(`${labels.mood}: ${ratings.mood}/5`);
  if (ratings.bodyPain !== undefined) parts.push(`${labels.bodyPain}: ${ratings.bodyPain}/5 (higher = more pain)`);

  return `\n\n[Today's check-in: ${parts.join(', ')}]`;
}

const DEMO_RESPONSES = [
  "Thank you for checking in today. Based on how you have described your energy and sleep, it sounds like your body may be carrying some extra weight lately. What has been on your mind most this week?",
  "I hear you. That kind of tiredness often comes from more than just the body — sometimes the mind is working hard too. Has anything at school, work, or home been feeling heavy recently?",
  "That makes a lot of sense. It is not easy to carry that. You have taken a good step by sharing — Komeza means to keep going, and that is exactly what you are doing. Would it help to think through one small thing you could do for yourself today?",
  "Thank you for trusting me with that. When you notice that fatigue coming on, does it usually happen at a particular time of day, or is it more constant throughout?",
  "You are doing well by paying attention to how your body feels — that awareness is a real strength. Remember, if things ever feel too heavy to carry alone, the 114 hotline is free and available day and night. You are not alone in this.",
];

let demoIndex = 0;

export const IS_DEMO = import.meta.env.DEV && !import.meta.env.VITE_USE_API;

export async function sendMessage(
  messages: ChatMessage[],
  currentRatings: Partial<SomaticRatings>,
  language: Language
): Promise<string> {
  const checkInContext = buildCheckInContext(currentRatings, language);

  if (IS_DEMO) {
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const response = DEMO_RESPONSES[demoIndex % DEMO_RESPONSES.length];
    demoIndex++;
    return response;
  }

  const apiMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Inject check-in context into the last user message
  if (apiMessages.length > 0 && apiMessages[apiMessages.length - 1].role === 'user') {
    apiMessages[apiMessages.length - 1] = {
      ...apiMessages[apiMessages.length - 1],
      content: apiMessages[apiMessages.length - 1].content + checkInContext,
    };
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }

  const data = await response.json() as { text: string };
  return data.text;
}

export function getOpeningMessage(
  ratings: Partial<SomaticRatings>,
  language: Language
): string {
  if (language === 'rw') {
    const energyNote = ratings.energy && ratings.energy <= 2
      ? 'Mbona imbaraga zawe nke uyu munsi. '
      : ratings.energy && ratings.energy >= 4
      ? 'Biragaragara ko uri n\'imbaraga nziza uyu munsi. '
      : '';

    return `Muraho! Ndi Komeza, inshuti yawe y'ubuzima. ${energyNote}Nshaka kumva ibintu byinshi kuri wewe. Umunsi wawe wagendeye ute?`;
  }

  const energyNote = ratings.energy && ratings.energy <= 2
    ? 'I can see your energy is lower today. '
    : ratings.energy && ratings.energy >= 4
    ? "It looks like you are feeling energised today. "
    : '';

  const painNote = ratings.bodyPain && ratings.bodyPain >= 4
    ? 'I noticed you mentioned some body discomfort. '
    : '';

  return `Hi, I am Komeza — your wellness companion. ${energyNote}${painNote}I would love to hear more about your day. What has been on your mind?`;
}
