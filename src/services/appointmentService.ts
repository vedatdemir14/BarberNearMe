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
  durationMin: number;
  status: AppointmentStatus;
  createdAt: any;
  notes?: string;
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

// ── Get appointments for customer ─────────────────────────────
export async function getCustomerAppointments(customerId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, 'appointments'),
    where('customerId', '==', customerId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
}

// ── Get appointments for barber ───────────────────────────────
export async function getBarberAppointments(barberId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, 'appointments'),
    where('barberId', '==', barberId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
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

  const q = query(
    collection(db, 'appointments'),
    where('barberId', '==', barberId),
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<=', Timestamp.fromDate(endOfDay)),
    where('status', 'in', ['pending', 'confirmed'])
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => (d.data() as Appointment).timeSlot);
}

// ── Update appointment status ─────────────────────────────────
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<void> {
  await updateDoc(doc(db, 'appointments', appointmentId), { status });
}
