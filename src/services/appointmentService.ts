import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  customerId: string;
  barberId: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  date: Timestamp;
  timeSlot: string;        // "10:30"
  durationMin?: number;
  status: AppointmentStatus;
  createdAt: any;
  notes?: string;
  kaporaPaid?: boolean;
  kaporaAmount?: number;
  totalPrice?: number;
}

// ── Create appointment ────────────────────────────────────────
export async function createAppointment(
  data: Omit<Appointment, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'appointments'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Get single appointment ────────────────────────────────────
export async function getAppointment(id: string): Promise<Appointment | null> {
  const snap = await getDoc(doc(db, 'appointments', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Appointment) : null;
}

// ── Get appointments for customer ─────────────────────────────
export async function getCustomerAppointments(customerId: string): Promise<Appointment[]> {
  // Sıralama JS'te (Firestore composite index gerektirmesin diye)
  const q = query(
    collection(db, 'appointments'),
    where('customerId', '==', customerId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Appointment))
    .sort((a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0));
}

// ── Get appointments for barber ───────────────────────────────
export async function getBarberAppointments(barberId: string): Promise<Appointment[]> {
  // Sıralama JS'te (Firestore composite index gerektirmesin diye)
  const q = query(
    collection(db, 'appointments'),
    where('barberId', '==', barberId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Appointment))
    .sort((a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0));
}

// ── Get booked slots for a specific day ───────────────────────
export async function getBookedSlots(
  barberId: string,
  date: Date
): Promise<string[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Sadece berbere göre çek; gün ve durum filtresini JS'te yap
  // (Firestore composite index gerektirmesin diye)
  const q = query(
    collection(db, 'appointments'),
    where('barberId', '==', barberId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => d.data() as Appointment)
    .filter(a => {
      if (!['pending', 'confirmed'].includes(a.status)) return false;
      const t = a.date?.toDate?.();
      return t && t >= startOfDay && t <= endOfDay;
    })
    .map(a => a.timeSlot);
}

// ── Update appointment status ─────────────────────────────────
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<void> {
  await updateDoc(doc(db, 'appointments', appointmentId), { status });
}
