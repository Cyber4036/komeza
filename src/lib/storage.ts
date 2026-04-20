import type { WellnessEntry, ChatMessage } from '../types';

const KEYS = {
  entries: 'komeza_entries',
  chatHistory: 'komeza_chat',
  onboarded: 'komeza_onboarded',
  language: 'komeza_language',
  darkMode: 'komeza_dark',
};

export function loadEntries(): WellnessEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.entries);
    return raw ? JSON.parse(raw) : generateDemoEntries();
  } catch {
    return generateDemoEntries();
  }
}

export function saveEntry(entry: WellnessEntry): void {
  const entries = loadEntries().filter((e) => e.date !== entry.date);
  entries.unshift(entry);
  localStorage.setItem(KEYS.entries, JSON.stringify(entries.slice(0, 90)));
}

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(KEYS.chatHistory);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  localStorage.setItem(KEYS.chatHistory, JSON.stringify(messages.slice(-50)));
}

export function loadOnboarded(): boolean {
  return localStorage.getItem(KEYS.onboarded) === 'true';
}

export function saveOnboarded(): void {
  localStorage.setItem(KEYS.onboarded, 'true');
}

export function loadLanguage(): 'en' | 'rw' {
  const lang = localStorage.getItem(KEYS.language);
  return lang === 'rw' ? 'rw' : 'en';
}

export function saveLanguage(lang: 'en' | 'rw'): void {
  localStorage.setItem(KEYS.language, lang);
}

export function loadDarkMode(): boolean {
  return localStorage.getItem(KEYS.darkMode) === 'true';
}

export function saveDarkMode(dark: boolean): void {
  localStorage.setItem(KEYS.darkMode, String(dark));
}

const QUEUE_KEY = 'komeza_pending_sync';

export function loadPendingQueue(): string[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingQueue(ids: string[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ids));
}

export function clearPendingQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

// Demo entries for a rich first-open experience
function generateDemoEntries(): WellnessEntry[] {
  const today = new Date();
  const entries: WellnessEntry[] = [];

  const seeds = [
    { energy: 3, sleep: 4, mood: 3, bodyPain: 1 },
    { energy: 2, sleep: 3, mood: 2, bodyPain: 3 },
    { energy: 4, sleep: 4, mood: 4, bodyPain: 1 },
    { energy: 2, sleep: 2, mood: 2, bodyPain: 4 }, // Thursday dip
    { energy: 4, sleep: 5, mood: 4, bodyPain: 1 },
    { energy: 5, sleep: 4, mood: 5, bodyPain: 1 },
    { energy: 3, sleep: 3, mood: 3, bodyPain: 2 },
    { energy: 3, sleep: 4, mood: 3, bodyPain: 2 },
    { energy: 4, sleep: 5, mood: 4, bodyPain: 1 },
    { energy: 2, sleep: 2, mood: 2, bodyPain: 3 },
    { energy: 3, sleep: 3, mood: 3, bodyPain: 1 },
    { energy: 5, sleep: 5, mood: 5, bodyPain: 1 },
    { energy: 4, sleep: 4, mood: 4, bodyPain: 2 },
    { energy: 2, sleep: 2, mood: 2, bodyPain: 4 },
  ];

  seeds.forEach((s, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    entries.push({
      id: `demo-${i}`,
      date: d.toISOString().split('T')[0],
      ratings: s,
    });
  });

  localStorage.setItem(KEYS.entries, JSON.stringify(entries));
  return entries;
}
