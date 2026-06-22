import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export type UserRole = 'customer' | 'barber';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: any;
  photoURL?: string;
}

// ── Register ──────────────────────────────────────────────────
export async function registerCustomer(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);

  const profile: UserProfile = {
    uid: user.uid,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    role: 'customer',
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', user.uid), profile);
  await sendEmailVerification(user);
  return user;
}

export async function registerBarber(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  shopName: string;
}): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);

  const profile: UserProfile = {
    uid: user.uid,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    role: 'barber',
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', user.uid), profile);

  // Barber shop placeholder — full details filled in onboarding
  await setDoc(doc(db, 'barbers', user.uid), {
    ownerId: user.uid,
    shopName: data.shopName,
    email: data.email,
    phone: data.phone,
    createdAt: serverTimestamp(),
    isActive: false, // activated after onboarding complete
    rating: 0,
    reviewCount: 0,
  });

  await sendEmailVerification(user);
  return user;
}

// ── Login ─────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// ── Logout ────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await signOut(auth);
}

// ── Get profile ───────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ── Update profile (ad / soyad / telefon) ─────────────────────
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'phone'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
}

// ── Password reset ────────────────────────────────────────────
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ── Email verification helpers ────────────────────────────────
export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function reloadAndCheckVerified(): Promise<boolean> {
  if (auth.currentUser) {
    await auth.currentUser.reload();
    return auth.currentUser.emailVerified;
  }
  return false;
}

// ── Auth state listener ───────────────────────────────────────
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
