import React, {
  createContext, useContext, useReducer, useEffect, useRef, useCallback, useState,
} from 'react';
import type { AppState, AppAction, SomaticRatings, WellnessEntry } from '../types';
import {
  loadEntries, saveEntry, loadChatHistory, saveChatHistory,
  loadOnboarded, saveOnboarded, loadLanguage, saveLanguage,
  loadDarkMode, saveDarkMode,
} from '../lib/storage';
import { FIREBASE_CONFIGURED } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  saveEntryToCloud, saveChatHistoryToCloud, saveUserProfile,
  loadUserProfile, loadEntriesFromCloud, loadChatHistoryFromCloud,
} from '../lib/firestore';

const initialState: AppState = {
  language: 'en',
  screen: 'onboarding',
  hasOnboarded: false,
  entries: [],
  chatHistory: [],
  currentRatings: {},
  crisisDetected: false,
  darkMode: false,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      saveLanguage(action.payload);
      return { ...state, language: action.payload };

    case 'SET_SCREEN':
      return { ...state, screen: action.payload };

    case 'COMPLETE_ONBOARDING':
      saveOnboarded();
      return { ...state, hasOnboarded: true, screen: 'home' };

    case 'SET_RATING':
      return {
        ...state,
        currentRatings: { ...state.currentRatings, [action.payload.category]: action.payload.value },
      };

    case 'SAVE_ENTRY': {
      const today = new Date().toISOString().split('T')[0];
      const ratings = state.currentRatings as SomaticRatings;
      if (!ratings.energy || !ratings.sleep || !ratings.mood || !ratings.bodyPain) return state;
      const entry: WellnessEntry = {
        id: `entry-${today}`,
        date: today,
        ratings,
      };
      saveEntry(entry);
      const updated = [entry, ...state.entries.filter((e) => e.date !== today)];
      return { ...state, entries: updated, screen: 'chat' };
    }

    case 'ADD_MESSAGE': {
      const updated = [...state.chatHistory, action.payload];
      saveChatHistory(updated);
      return { ...state, chatHistory: updated };
    }

    case 'CLEAR_CHAT':
      saveChatHistory([]);
      return { ...state, chatHistory: [] };

    case 'TRIGGER_CRISIS':
      return { ...state, crisisDetected: true };

    case 'DISMISS_CRISIS':
      return { ...state, crisisDetected: false };

    case 'LOAD_ENTRIES':
      return { ...state, entries: action.payload };

    case 'TOGGLE_DARK_MODE': {
      const newDark = !state.darkMode;
      saveDarkMode(newDark);
      return { ...state, darkMode: newDark };
    }

    case 'LOAD_ALL_USER_DATA': {
      const { entries, chatHistory, language, darkMode, hasOnboarded } = action.payload;
      saveLanguage(language);
      saveDarkMode(darkMode);
      if (hasOnboarded) saveOnboarded();
      return {
        ...state,
        entries,
        chatHistory,
        language,
        darkMode,
        hasOnboarded,
        screen: hasOnboarded ? 'home' : 'onboarding',
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  dataLoaded: boolean;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(!FIREBASE_CONFIGURED);

  const [state, rawDispatch] = useReducer(reducer, initialState, (): AppState => {
    if (!FIREBASE_CONFIGURED) {
      const onboarded    = loadOnboarded();
      const language     = loadLanguage();
      const entries      = loadEntries();
      const chatHistory  = loadChatHistory();
      const darkMode     = loadDarkMode();
      return {
        ...initialState, language, hasOnboarded: onboarded,
        screen: (onboarded ? 'home' : 'onboarding') as AppState['screen'],
        entries, chatHistory, darkMode,
      };
    }
    return initialState;
  });

  // ── Load from Firestore after sign-in ──────────────────────────────────────
  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !user) return;

    async function load() {
      const [profile, cloudEntries, cloudChat] = await Promise.all([
        loadUserProfile(user!.uid),
        loadEntriesFromCloud(user!.uid),
        loadChatHistoryFromCloud(user!.uid),
      ]);

      if (!profile) {
        // First sign-in: migrate any non-demo localStorage data
        const localLang      = loadLanguage();
        const localDark      = loadDarkMode();
        const localOnboarded = loadOnboarded();
        const localEntries   = loadEntries().filter((e) => !e.id.startsWith('demo-'));
        const localChat      = loadChatHistory();

        await saveUserProfile(user!.uid, {
          displayName: user!.displayName ?? '',
          email:       user!.email ?? '',
          photoURL:    user!.photoURL ?? '',
          language:    localLang,
          darkMode:    localDark,
          hasOnboarded: localOnboarded,
          createdAt:   new Date().toISOString(),
        });
        for (const entry of localEntries) {
          await saveEntryToCloud(user!.uid, entry);
        }

        rawDispatch({
          type: 'LOAD_ALL_USER_DATA',
          payload: { entries: localEntries, chatHistory: localChat, language: localLang, darkMode: localDark, hasOnboarded: localOnboarded },
        });
      } else {
        rawDispatch({
          type: 'LOAD_ALL_USER_DATA',
          payload: {
            entries:      cloudEntries,
            chatHistory:  cloudChat,
            language:     profile.language,
            darkMode:     profile.darkMode,
            hasOnboarded: profile.hasOnboarded,
          },
        });
      }

      setDataLoaded(true);
    }

    load().catch((err) => {
      console.error('Firestore load failed, using localStorage fallback:', err);
      const language    = loadLanguage();
      const darkMode    = loadDarkMode();
      const hasOnboarded = loadOnboarded();
      const entries     = loadEntries().filter((e) => !e.id.startsWith('demo-'));
      const chatHistory = loadChatHistory();
      rawDispatch({ type: 'LOAD_ALL_USER_DATA', payload: { entries, chatHistory, language, darkMode, hasOnboarded } });
      setDataLoaded(true);
    });
  }, [user]);

  // ── Sync theme attribute ───────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
  }, [state.darkMode]);

  // ── Sync state → Firestore (only after initial data load) ─────────────────
  const prevEntriesLenRef = useRef<number | null>(null);
  const prevChatLenRef    = useRef<number | null>(null);
  const syncEnabled       = useRef(false);

  useEffect(() => {
    if (dataLoaded && FIREBASE_CONFIGURED && user) syncEnabled.current = true;
  }, [dataLoaded, user]);

  useEffect(() => {
    if (!syncEnabled.current || !user) return;
    if (prevEntriesLenRef.current === null) { prevEntriesLenRef.current = state.entries.length; return; }
    if (state.entries.length !== prevEntriesLenRef.current) {
      prevEntriesLenRef.current = state.entries.length;
      if (state.entries[0]) saveEntryToCloud(user.uid, state.entries[0]).catch(console.error);
    }
  }, [state.entries, user]);

  useEffect(() => {
    if (!syncEnabled.current || !user) return;
    if (prevChatLenRef.current === null) { prevChatLenRef.current = state.chatHistory.length; return; }
    if (state.chatHistory.length !== prevChatLenRef.current) {
      prevChatLenRef.current = state.chatHistory.length;
      saveChatHistoryToCloud(user.uid, state.chatHistory).catch(console.error);
    }
  }, [state.chatHistory, user]);

  useEffect(() => {
    if (!syncEnabled.current || !user) return;
    saveUserProfile(user.uid, { language: state.language }).catch(console.error);
  }, [state.language, user]);

  useEffect(() => {
    if (!syncEnabled.current || !user) return;
    saveUserProfile(user.uid, { darkMode: state.darkMode }).catch(console.error);
  }, [state.darkMode, user]);

  useEffect(() => {
    if (!syncEnabled.current || !user || !state.hasOnboarded) return;
    saveUserProfile(user.uid, { hasOnboarded: true }).catch(console.error);
  }, [state.hasOnboarded, user]);

  // ── Wrap dispatch so callers can't tell ───────────────────────────────────
  const dispatch = useCallback((action: AppAction) => rawDispatch(action), []);

  return (
    <AppContext.Provider value={{ state, dispatch, dataLoaded }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
