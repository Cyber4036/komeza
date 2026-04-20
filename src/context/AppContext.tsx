import React, {
  createContext, useContext, useReducer, useEffect, useRef, useCallback, useState,
} from 'react';
import type { AppState, AppAction, SomaticRatings, WellnessEntry } from '../types';
import {
  loadEntries, saveEntry, loadChatHistory, saveChatHistory,
  loadOnboarded, saveOnboarded, loadLanguage, saveLanguage,
  loadDarkMode, saveDarkMode,
  loadPendingQueue, savePendingQueue, clearPendingQueue,
} from '../lib/storage';
import { FIREBASE_CONFIGURED } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  saveEntryToCloud, saveChatMessageToCloud, saveUserProfile,
  loadUserProfile, loadEntriesFromCloud, loadChatHistoryFromCloud,
} from '../lib/firestore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const initialState: AppState = {
  language: 'en',
  screen: 'onboarding',
  hasOnboarded: false,
  entries: [],
  chatHistory: [],
  currentRatings: {},
  crisisDetected: false,
  darkMode: false,
  syncStatus: 'idle',
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

    case 'MERGE_CLOUD_DATA': {
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
        syncStatus: 'idle',
        screen: hasOnboarded ? 'home' : 'onboarding',
      };
    }

    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };

    case 'SET_ONLINE':
      return { ...state, syncStatus: action.payload ? 'idle' : 'offline' };

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
  const isOnline = useNetworkStatus();
  const [dataLoaded, setDataLoaded] = useState(!FIREBASE_CONFIGURED);

  const [state, rawDispatch] = useReducer(reducer, initialState, (): AppState => {
    if (!FIREBASE_CONFIGURED) {
      const onboarded   = loadOnboarded();
      const language    = loadLanguage();
      const entries     = loadEntries();
      const chatHistory = loadChatHistory();
      const darkMode    = loadDarkMode();
      return {
        ...initialState, language, hasOnboarded: onboarded,
        screen: (onboarded ? 'home' : 'onboarding') as AppState['screen'],
        entries, chatHistory, darkMode,
      };
    }
    return initialState;
  });

  // ── Keep syncStatus in sync with live network state ────────────────────────
  useEffect(() => {
    rawDispatch({ type: 'SET_ONLINE', payload: isOnline });
  }, [isOnline]);

  // ── Load from Firestore after sign-in ──────────────────────────────────────
  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !user) return;

    async function load() {
      rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
      try {
        const [profile, cloudEntries, cloudChat] = await Promise.all([
          loadUserProfile(user!.uid),
          loadEntriesFromCloud(user!.uid),
          loadChatHistoryFromCloud(user!.uid),
        ]);

        if (!profile) {
          // First sign-in: merge local (non-demo) entries with any existing cloud entries.
          // Cloud wins on same date; local-only entries are uploaded.
          const localLang      = loadLanguage();
          const localDark      = loadDarkMode();
          const localOnboarded = loadOnboarded();
          const localEntries   = loadEntries().filter((e) => !e.id.startsWith('demo-'));
          const localChat      = loadChatHistory();

          const entryMap = new Map<string, WellnessEntry>();
          for (const e of localEntries) entryMap.set(e.date, e);
          for (const e of cloudEntries) entryMap.set(e.date, e); // cloud wins on conflict
          const mergedEntries = Array.from(entryMap.values())
            .sort((a, b) => b.date.localeCompare(a.date));

          await saveUserProfile(user!.uid, {
            displayName:  user!.displayName ?? '',
            email:        user!.email ?? '',
            photoURL:     user!.photoURL ?? '',
            language:     localLang,
            darkMode:     localDark,
            hasOnboarded: localOnboarded,
            createdAt:    new Date().toISOString(),
          });

          const cloudDates = new Set(cloudEntries.map((e) => e.date));
          for (const entry of localEntries.filter((e) => !cloudDates.has(e.date))) {
            await saveEntryToCloud(user!.uid, entry);
          }

          rawDispatch({
            type: 'MERGE_CLOUD_DATA',
            payload: {
              entries:      mergedEntries,
              chatHistory:  cloudChat.length > 0 ? cloudChat : localChat,
              language:     localLang,
              darkMode:     localDark,
              hasOnboarded: localOnboarded,
            },
          });
        } else {
          rawDispatch({
            type: 'MERGE_CLOUD_DATA',
            payload: {
              entries:      cloudEntries,
              chatHistory:  cloudChat,
              language:     profile.language,
              darkMode:     profile.darkMode,
              hasOnboarded: profile.hasOnboarded,
            },
          });
        }

        clearPendingQueue();
        setDataLoaded(true);
      } catch (err) {
        console.error('Firestore load failed, using localStorage fallback:', err);
        rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
        const language     = loadLanguage();
        const darkMode     = loadDarkMode();
        const hasOnboarded = loadOnboarded();
        const entries      = loadEntries().filter((e) => !e.id.startsWith('demo-'));
        const chatHistory  = loadChatHistory();
        rawDispatch({ type: 'LOAD_ALL_USER_DATA', payload: { entries, chatHistory, language, darkMode, hasOnboarded } });
        setDataLoaded(true);
      }
    }

    load();
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

  // Entries: only sync the newest entry
  useEffect(() => {
    if (!syncEnabled.current || !user) return;
    if (prevEntriesLenRef.current === null) { prevEntriesLenRef.current = state.entries.length; return; }
    if (state.entries.length === prevEntriesLenRef.current) return;
    prevEntriesLenRef.current = state.entries.length;

    const newest = state.entries[0];
    if (!newest) return;

    rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
    saveEntryToCloud(user.uid, newest)
      .then(() => rawDispatch({ type: 'SET_SYNC_STATUS', payload: isOnline ? 'idle' : 'offline' }))
      .catch((err) => {
        console.error('Entry sync failed:', err);
        rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
        const q = loadPendingQueue();
        if (!q.includes(newest.id)) savePendingQueue([...q, newest.id]);
      });
  }, [state.entries, user, isOnline]);

  // Chat: only sync the newest message (incremental)
  useEffect(() => {
    if (!syncEnabled.current || !user) return;
    if (prevChatLenRef.current === null) { prevChatLenRef.current = state.chatHistory.length; return; }
    if (state.chatHistory.length === prevChatLenRef.current) return;
    prevChatLenRef.current = state.chatHistory.length;

    const newest = state.chatHistory[state.chatHistory.length - 1];
    if (!newest) return;

    rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
    saveChatMessageToCloud(user.uid, newest)
      .then(() => rawDispatch({ type: 'SET_SYNC_STATUS', payload: isOnline ? 'idle' : 'offline' }))
      .catch((err) => {
        console.error('Chat sync failed:', err);
        rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
      });
  }, [state.chatHistory, user, isOnline]);

  // Language preference
  useEffect(() => {
    if (!syncEnabled.current || !user) return;
    rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
    saveUserProfile(user.uid, { language: state.language })
      .then(() => rawDispatch({ type: 'SET_SYNC_STATUS', payload: isOnline ? 'idle' : 'offline' }))
      .catch(() => rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'error' }));
  }, [state.language, user, isOnline]);

  // Dark mode preference
  useEffect(() => {
    if (!syncEnabled.current || !user) return;
    rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
    saveUserProfile(user.uid, { darkMode: state.darkMode })
      .then(() => rawDispatch({ type: 'SET_SYNC_STATUS', payload: isOnline ? 'idle' : 'offline' }))
      .catch(() => rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'error' }));
  }, [state.darkMode, user, isOnline]);

  // Onboarding completion
  useEffect(() => {
    if (!syncEnabled.current || !user || !state.hasOnboarded) return;
    rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });
    saveUserProfile(user.uid, { hasOnboarded: true })
      .then(() => rawDispatch({ type: 'SET_SYNC_STATUS', payload: isOnline ? 'idle' : 'offline' }))
      .catch(() => rawDispatch({ type: 'SET_SYNC_STATUS', payload: 'error' }));
  }, [state.hasOnboarded, user, isOnline]);

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
