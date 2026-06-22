import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  barberId: string;
  appointmentId: string;
  rating: number;        // 1–5
  qualityRating: number;
  cleanlinessRating: number;
  timelinessRating: number;
  comment: string;
  createdAt: any;
}

// Berberin ortalama puanını (1–5) ve yorum sayısını gerçek yorumlardan yeniden hesapla
export async function recomputeBarberRating(barberId: string): Promise<void> {
  const q = query(collection(db, 'reviews'), where('barberId', '==', barberId));
  const snap = await getDocs(q);
  const ratings = snap.docs
    .map(d => (d.data() as Review).rating)
    .filter(r => typeof r === 'number' && r > 0);
  const count = ratings.length;
  const avg = count ? ratings.reduce((a, b) => a + b, 0) / count : 0;
  await updateDoc(doc(db, 'barbers', barberId), {
    rating: count ? Math.round(avg * 10) / 10 : 0, // yorum yoksa 0, varsa 1–5 ortalama
    reviewCount: count,
  });
}

// ── Add review ────────────────────────────────────────────────
export async function addReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'reviews'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  // Berberin ortalama puanını gerçek yorumlardan güncelle
  await recomputeBarberRating(data.barberId);
}

// ── Yorumu sil (+ berber ortalamasını güncelle) ───────────────
export async function deleteReview(reviewId: string): Promise<void> {
  const ref = doc(db, 'reviews', reviewId);
  const snap = await getDoc(ref);
  const barberId = snap.exists() ? (snap.data() as Review).barberId : null;
  await deleteDoc(ref);
  if (barberId) await recomputeBarberRating(barberId);
}

// ── Get reviews for barber ────────────────────────────────────
export async function getBarberReviews(barberId: string): Promise<Review[]> {
  // Sıralama JS'te (Firestore composite index gerektirmesin diye)
  const q = query(
    collection(db, 'reviews'),
    where('barberId', '==', barberId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Review))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

// ── Kullanıcının kendi yorumları (Değerlendirmelerim) ────────
export async function getCustomerReviews(customerId: string): Promise<Review[]> {
  const q = query(collection(db, 'reviews'), where('customerId', '==', customerId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Review))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

// ── Bir randevuya ait yorum var mı? (mükerrer değerlendirmeyi önlemek için)
export async function getReviewByAppointment(appointmentId: string): Promise<Review | null> {
  const q = query(collection(db, 'reviews'), where('appointmentId', '==', appointmentId));
  const snap = await getDocs(q);
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Review);
}
