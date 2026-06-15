import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getUserProfile, UserProfile } from '../services/authService';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
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

  return state;
}
