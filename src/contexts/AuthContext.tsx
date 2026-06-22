import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { onAuthChange, getUserProfile, UserProfile } from '../services/authService';
import { registerForPushNotifications } from '../services/notificationService';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthContextValue, 'refreshUser'>>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setState(prev => ({ ...prev, loading: false }));
    }, 5000);

    const unsubscribe = onAuthChange(async (user) => {
      clearTimeout(timeout);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setState({ user, profile, loading: false });
          registerForPushNotifications(user.uid).catch(() => {});
        } catch {
          setState({ user, profile: null, loading: false });
        }
      } else {
        setState({ user: null, profile: null, loading: false });
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return;
    await current.reload();
    const profile = await getUserProfile(current.uid).catch(() => null);
    // auth.currentUser'ı yeniden oku — reload sonrası emailVerified güncel olur
    setState({ user: auth.currentUser!, profile, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
