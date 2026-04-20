import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, googleProvider, FIREBASE_CONFIGURED } from '../lib/firebase';

interface AuthCtx {
  user: User | null;
  authLoading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  authLoading: false,
  configured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setLoading] = useState(FIREBASE_CONFIGURED);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED || !auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) return;
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    if (!auth) return;
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, configured: FIREBASE_CONFIGURED, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
