import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  serverTimestamp,
  GeoPoint,
} from 'firebase/firestore';
import { db } from './firebase';
// Storage devre dışı (plan yükseltme gerektirir)

export interface BarberShop {
  id: string;
  ownerId: string;
  shopName: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
  country: string;
  location?: GeoPoint;
  photoURLs: string[];
  licenseURL?: string;
  services: Service[];
  staff: StaffMember[];
  workingHours: WorkingHours;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: any;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

export interface StaffMember {
  id: string;
  name: string;
  photoURL?: string;
  title: string;
}

export interface WorkingHours {
  days: number[]; // 0=Mon … 6=Sun
  openTime: string;  // "09:00"
  closeTime: string; // "21:00"
  slotDurationMin: number;
}

// ── Get all active barbers ────────────────────────────────────
export async function getBarbers(): Promise<BarberShop[]> {
  // Sıralama JS'te yapılıyor (Firestore composite index gerektirmesin diye)
  const q = query(
    collection(db, 'barbers'),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as BarberShop))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

// ── Get single barber ─────────────────────────────────────────
export async function getBarber(id: string): Promise<BarberShop | null> {
  const snap = await getDoc(doc(db, 'barbers', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as BarberShop) : null;
}

// ── Update barber onboarding (step 1 → services & staff) ─────
export async function updateBarberServices(
  barberId: string,
  services: Service[],
  staff: StaffMember[]
): Promise<void> {
  await updateDoc(doc(db, 'barbers', barberId), { services, staff });
}

// ── Update barber location & photos ──────────────────────────
export async function updateBarberLocation(
  barberId: string,
  data: {
    address: string;
    neighborhood: string;
    city: string;
    country: string;
    location?: GeoPoint;
    photoURLs: string[];
  }
): Promise<void> {
  await updateDoc(doc(db, 'barbers', barberId), data);
}

// ── Cüzdan: kapora tutarını berberin bakiyesine ekle ─────────
export async function addToWallet(barberId: string, amount: number): Promise<void> {
  await updateDoc(doc(db, 'barbers', barberId), {
    walletBalance: increment(amount),
  });
}

// ── Update working hours & activate ──────────────────────────
export async function updateBarberHoursAndActivate(
  barberId: string,
  workingHours: WorkingHours,
  licenseURL: string
): Promise<void> {
  await updateDoc(doc(db, 'barbers', barberId), {
    workingHours,
    licenseURL,
    isActive: true,
  });
}
