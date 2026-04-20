export type Language = 'en' | 'rw';
export type Screen = 'onboarding' | 'home' | 'chat' | 'insights' | 'brief' | 'safety';

export interface SomaticRatings {
  energy: number;   // 1–5 (1=very low, 5=very high)
  sleep: number;    // 1–5 (1=poor, 5=excellent)
  mood: number;     // 1–5 (1=very low, 5=very high)
  bodyPain: number; // 1–5 (1=none, 5=severe — inverted for wellness score)
}

export interface WellnessEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  ratings: SomaticRatings;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AppState {
  language: Language;
  screen: Screen;
  hasOnboarded: boolean;
  entries: WellnessEntry[];
  chatHistory: ChatMessage[];
  currentRatings: Partial<SomaticRatings>;
  crisisDetected: boolean;
  darkMode: boolean;
}

export type AppAction =
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_SCREEN'; payload: Screen }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'SET_RATING'; payload: { category: keyof SomaticRatings; value: number } }
  | { type: 'SAVE_ENTRY' }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_CHAT' }
  | { type: 'TRIGGER_CRISIS' }
  | { type: 'DISMISS_CRISIS' }
  | { type: 'LOAD_ENTRIES'; payload: WellnessEntry[] }
  | { type: 'TOGGLE_DARK_MODE' }
  | {
      type: 'LOAD_ALL_USER_DATA';
      payload: {
        entries: WellnessEntry[];
        chatHistory: ChatMessage[];
        language: Language;
        darkMode: boolean;
        hasOnboarded: boolean;
      };
    };
