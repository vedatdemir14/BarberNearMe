import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { onAuthChange, getUserProfile, UserProfile } from '../services/authService';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<Omit<AuthState, 'refreshUser'>>({
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
    setState({ user: auth.currentUser!, profile, loading: false });
  }, []);

  return { ...state, refreshUser };
}
