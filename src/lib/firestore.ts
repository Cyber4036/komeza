import {
  doc, setDoc, getDoc,
  collection, getDocs, writeBatch,
  query, orderBy, limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { WellnessEntry, ChatMessage } from '../types';
import type { Language } from './i18n';

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  language: Language;
  darkMode: boolean;
  hasOnboarded: boolean;
  createdAt: string;
}

// ─── User profile ────────────────────────────────────────────────────────────

export async function saveUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ─── Wellness entries ─────────────────────────────────────────────────────────

export async function saveEntryToCloud(uid: string, entry: WellnessEntry): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'users', uid, 'entries', entry.date), entry);
}

export async function loadEntriesFromCloud(uid: string): Promise<WellnessEntry[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'entries'), orderBy('date', 'desc'), limit(90)),
  );
  return snap.docs.map((d) => d.data() as WellnessEntry);
}

// ─── Chat history ─────────────────────────────────────────────────────────────

export async function saveChatHistoryToCloud(uid: string, messages: ChatMessage[]): Promise<void> {
  if (!db) return;
  const ref = collection(db, 'users', uid, 'chatHistory');
  const batch = writeBatch(db);
  const existing = await getDocs(ref);
  existing.docs.forEach((d) => batch.delete(d.ref));
  messages.slice(-50).forEach((msg) => batch.set(doc(ref, msg.id), msg));
  await batch.commit();
}

export async function loadChatHistoryFromCloud(uid: string): Promise<ChatMessage[]> {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'chatHistory'), orderBy('timestamp', 'asc'), limit(50)),
  );
  return snap.docs.map((d) => d.data() as ChatMessage);
}
