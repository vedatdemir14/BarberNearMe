import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// getReactNativePersistence yalnızca firebase'in React Native build'inde var;
// tipleri dışa açmıyor ama runtime'da mevcut.
import * as firebaseAuth from 'firebase/auth';
const getReactNativePersistence = (firebaseAuth as any).getReactNativePersistence;
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase web config — public by design (security is via Firestore rules).
// Env vars are used when present; the hardcoded fallback guarantees a valid
// config in builds where EXPO_PUBLIC_* env injection doesn't reach the bundle.
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? 'AIzaSyBgtVcq9Www99US9wm2n_jAsWD4aa1BZGM',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? 'barbernearme-b86c8.firebaseapp.com',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? 'barbernearme-b86c8',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? 'barbernearme-b86c8.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '1099137442128',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '1:1099137442128:web:bfd9583227862e692ecc55',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
