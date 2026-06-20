import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
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

// ── Add review ────────────────────────────────────────────────
export async function addReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'reviews'), {
    ...data,
    createdAt: serverTimestamp(),
  });

  // Update barber's aggregate rating (simple running average approximation)
  const barberRef = doc(db, 'barbers', data.barberId);
  await updateDoc(barberRef, {
    reviewCount: increment(1),
    // NOTE: proper avg calculation should use a Cloud Function;
    // this is a placeholder for the prototype.
  });
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
