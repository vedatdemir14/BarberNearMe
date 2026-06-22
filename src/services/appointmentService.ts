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
import { addToWallet } from './barberService';
import { getUserPushToken, sendPushNotification } from './notificationService';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  customerId: string;
  customerName?: string;
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
  cancelledBy?: 'customer' | 'barber';
  createdAt: any;
  notes?: string;
  // Kapora ödeme (Payment ekranı)
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
  // Berbere bildirim: yeni randevu talebi
  const apptData = data as Appointment;
  getUserPushToken(apptData.barberId).then(token => {
    if (token) sendPushNotification(token, '✂️ Yeni Randevu Talebi', `Yeni bir randevu talebi aldınız.`);
  }).catch(() => {});

  return ref.id;
}

// ── Update appointment status ─────────────────────────────────
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  cancelledBy?: 'customer' | 'barber',
): Promise<void> {
  // Önceki durumu al (cüzdana çift ekleme yapmamak için)
  const prev = await getAppointment(id);

  await updateDoc(doc(db, 'appointments', id), {
    status,
    ...(status === 'cancelled' && cancelledBy ? { cancelledBy } : {}),
  });

  // Randevu tamamlandığında kalan ücret (toplam − kapora) berberin cüzdanına eklenir.
  // Kapora rezervasyonda zaten eklenmişti; burada sadece geri kalanı ekliyoruz.
  if (status === 'completed' && prev && prev.status !== 'completed') {
    const total = prev.totalPrice ?? prev.servicePrice ?? 0;
    const kapora = prev.kaporaAmount ?? 0;
    const remaining = Math.max(0, total - kapora);
    if (remaining > 0) {
      await addToWallet(prev.barberId, remaining).catch(() => {});
    }
  }

  const appt = await getAppointment(id);
  if (!appt) return;

  // Müşteri kendi iptal ettiyse → bildirim BERBERE gider (müşteri zaten biliyor)
  if (status === 'cancelled' && cancelledBy === 'customer') {
    const bToken = await getUserPushToken(appt.barberId).catch(() => null);
    if (bToken) sendPushNotification(bToken, '❌ Randevu İptal Edildi', 'Bir müşteri randevusunu iptal etti.', { appointmentId: id }).catch(() => {});
    return;
  }

  // Diğer tüm durumlar → bildirim MÜŞTERİYE gider
  const token = await getUserPushToken(appt.customerId).catch(() => null);
  if (!token) return;

  const messages: Record<string, { title: string; body: string }> = {
    confirmed:  { title: '✅ Randevunuz Onaylandı', body: `${appt.timeSlot} randevunuz onaylandı.` },
    cancelled:  { title: '❌ Randevunuz İptal Edildi', body: 'Randevunuz berber tarafından iptal edildi.' },
    completed:  { title: '🎉 Randevunuz Tamamlandı', body: 'Randevunuzu değerlendirmeyi unutmayın!' },
  };

  const msg = messages[status];
  if (msg) sendPushNotification(token, msg.title, msg.body, { appointmentId: id }).catch(() => {});
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
// Süre bilgisiyle döner ki süreye göre çakışma hesaplanabilsin.
export interface BookedSlot {
  timeSlot: string;     // "10:30"
  durationMin: number;
}

export async function getBookedSlots(
  barberId: string,
  date: Date
): Promise<BookedSlot[]> {
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
    .map(a => ({ timeSlot: a.timeSlot, durationMin: a.durationMin ?? 30 }));
}
