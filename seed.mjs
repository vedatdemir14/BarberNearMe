/**
 * BarberNearMe – Firestore Seeder (gerçek Urla/Gülbahçe berberleri)
 * Çalıştırmak için: node seed.mjs
 *
 * NOT: Bu script `barbers` ve `reviews` koleksiyonlarını ÖNCE temizler,
 * sonra aşağıdaki berberleri yazar. Yani sadece bu berberler kalır.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  GeoPoint,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBgtVcq9Www99US9wm2n_jAsWD4aa1BZGM',
  authDomain: 'barbernearme-b86c8.firebaseapp.com',
  projectId: 'barbernearme-b86c8',
  storageBucket: 'barbernearme-b86c8.firebasestorage.app',
  messagingSenderId: '1099137442128',
  appId: '1:1099137442128:web:bfd9583227862e692ecc55',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Berberler (gerçek koordinatlar) ─────────────────────────────────────────
const barbers = [
  {
    id: 'barber_001',
    ownerId: 'owner_sg',
    shopName: 'S&G Erkek Kuaförü',
    email: '',
    phone: '0530 262 64 51',
    address: 'Gül Bahçe Cd. No:73 D:1C',
    neighborhood: 'Gülbahçe',
    city: 'İzmir',
    country: 'TR',
    location: new GeoPoint(38.33358261838048, 26.644848473131205),
    photoURLs: [],
    licenseURL: '',
    services: [
      { id: 's1', name: 'Saç', price: 500, durationMin: 30 },
      { id: 's2', name: 'Sakal', price: 300, durationMin: 20 },
      { id: 's3', name: 'Saç + Sakal', price: 700, durationMin: 50 },
    ],
    staff: [
      { id: 'st1', name: 'Osman', title: 'Usta Berber' },
      { id: 'st2', name: 'Mehmet', title: 'Berber' },
    ],
    // Pazartesi hariç her gün (0=Pzt … 6=Paz) → Pazartesi kapalı
    workingHours: { days: [1, 2, 3, 4, 5, 6], openTime: '09:00', closeTime: '20:00', slotDurationMin: 30 },
    rating: 4.8,
    reviewCount: 3,
    isActive: true,
  },
  {
    id: 'barber_002',
    ownerId: 'owner_joker',
    shopName: 'Joker Erkek Kuaförü',
    email: '',
    phone: '+90 506 038 28 71',
    address: '12076. Sk. No:2 D:1',
    neighborhood: 'Gülbahçe',
    city: 'İzmir',
    country: 'TR',
    location: new GeoPoint(38.330920343969716, 26.642713406122613),
    photoURLs: [],
    licenseURL: '',
    services: [
      { id: 's1', name: 'Saç', price: 500, durationMin: 30 },
      { id: 's2', name: 'Sakal', price: 200, durationMin: 20 },
      { id: 's3', name: 'Saç & Sakal', price: 600, durationMin: 45 },
    ],
    staff: [
      { id: 'st1', name: 'Vedat', title: 'Usta Berber' },
      { id: 'st2', name: 'Burak', title: 'Berber' },
    ],
    // Pazar hariç → Pazar kapalı
    workingHours: { days: [0, 1, 2, 3, 4, 5], openTime: '09:00', closeTime: '21:00', slotDurationMin: 30 },
    rating: 4.6,
    reviewCount: 2,
    isActive: true,
  },
  {
    id: 'barber_003',
    ownerId: 'owner_erol',
    shopName: 'Salon Hair Erol Stylist',
    email: '',
    phone: '0530 042 54 12',
    address: 'Hacı İsa, Yeni Otopark Sk. No:6120',
    neighborhood: 'Hacı İsa, Urla',
    city: 'İzmir',
    country: 'TR',
    location: new GeoPoint(38.32552914937929, 26.767165215859855),
    photoURLs: [],
    licenseURL: '',
    services: [
      { id: 's1', name: 'Saç Traşı', price: 600, durationMin: 30 },
      { id: 's2', name: 'Saç + Sakal', price: 800, durationMin: 50 },
      { id: 's3', name: 'Sakal Traşı', price: 300, durationMin: 20 },
      { id: 's4', name: 'Çocuk Saç Traşı', price: 500, durationMin: 25 },
      { id: 's5', name: 'Buharlı Cilt Bakımı', price: 300, durationMin: 30 },
    ],
    staff: [
      { id: 'st1', name: 'Erol', title: 'Stilist' },
    ],
    // Çalışma günü belirtilmemiş → varsayım: Pazar kapalı, 09:00–20:00
    workingHours: { days: [0, 1, 2, 3, 4, 5], openTime: '09:00', closeTime: '20:00', slotDurationMin: 30 },
    rating: 4.7,
    reviewCount: 2,
    isActive: true,
  },
];

// ─── Örnek yorumlar ──────────────────────────────────────────────────────────
const reviews = [
  { barberId: 'barber_001', customerName: 'Ali Y.', rating: 5, comment: 'Usta işini biliyor, çok memnun kaldım.' },
  { barberId: 'barber_001', customerName: 'Kerem T.', rating: 5, comment: 'Temiz ve hızlı, kesinlikle tavsiye ederim.' },
  { barberId: 'barber_001', customerName: 'Mert A.', rating: 4, comment: 'Fiyat/performans gayet iyi.' },
  { barberId: 'barber_002', customerName: 'Caner B.', rating: 5, comment: 'Vedat usta efsane, sakal tıraşı çok iyi.' },
  { barberId: 'barber_002', customerName: 'Emre K.', rating: 4, comment: 'Güzel ortam, öğrenciye uygun.' },
  { barberId: 'barber_003', customerName: 'Hakan D.', rating: 5, comment: 'Cilt bakımı harikaydı, ferahladım.' },
  { barberId: 'barber_003', customerName: 'Onur S.', rating: 4, comment: 'Saç sakal kombo başarılı.' },
];

async function wipe(coll) {
  const snap = await getDocs(collection(db, coll));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  return snap.size;
}

async function seed() {
  console.log('🔥 Firestore seed başlatılıyor...\n');

  const bDel = await wipe('barbers');
  const rDel = await wipe('reviews');
  console.log(`🧹 Temizlendi: ${bDel} berber, ${rDel} yorum\n`);

  for (const barber of barbers) {
    const { id, ...data } = barber;
    await setDoc(doc(db, 'barbers', id), { ...data, createdAt: serverTimestamp() });
    console.log(`✅ ${barber.shopName} (${id})`);
  }

  for (const r of reviews) {
    await addDoc(collection(db, 'reviews'), {
      customerId: 'seed_' + r.customerName,
      customerName: r.customerName,
      barberId: r.barberId,
      appointmentId: 'seed',
      rating: r.rating,
      qualityRating: r.rating,
      cleanlinessRating: r.rating,
      timelinessRating: r.rating,
      comment: r.comment,
      createdAt: serverTimestamp(),
    });
  }
  console.log(`\n💬 ${reviews.length} yorum eklendi`);

  console.log(`\n🎉 ${barbers.length} berber başarıyla yüklendi!`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
