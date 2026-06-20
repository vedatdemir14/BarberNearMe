/**
 * BarberNearMe – Firestore Seeder (gerçek Urla/Gülbahçe berberleri)
 * Çalıştırmak için: node seed.mjs
 *
 * UPSERT modu: Bu script HİÇBİR ŞEYİ SİLMEZ. Sabit id'lerle yazar; tekrar
 * çalıştırınca var olanları günceller, yenileri ekler. Yeni berber eklemek
 * için aşağıdaki `barbers` dizisine ekle (benzersiz bir id ver) ve çalıştır.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
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
// Yeni berber eklemek için yeni bir nesne ekle; "id" benzersiz olsun (barber_004…)
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

// ─── Örnek yorumlar (sabit id → tekrar çalışınca çoğalmaz) ───────────────────
const reviews = [
  { id: 'rev_001', barberId: 'barber_001', customerName: 'Ali Y.', rating: 5, comment: 'Usta işini biliyor, çok memnun kaldım.' },
  { id: 'rev_002', barberId: 'barber_001', customerName: 'Kerem T.', rating: 5, comment: 'Temiz ve hızlı, kesinlikle tavsiye ederim.' },
  { id: 'rev_003', barberId: 'barber_001', customerName: 'Mert A.', rating: 4, comment: 'Fiyat/performans gayet iyi.' },
  { id: 'rev_004', barberId: 'barber_002', customerName: 'Caner B.', rating: 5, comment: 'Vedat usta efsane, sakal tıraşı çok iyi.' },
  { id: 'rev_005', barberId: 'barber_002', customerName: 'Emre K.', rating: 4, comment: 'Güzel ortam, öğrenciye uygun.' },
  { id: 'rev_006', barberId: 'barber_003', customerName: 'Hakan D.', rating: 5, comment: 'Cilt bakımı harikaydı, ferahladım.' },
  { id: 'rev_007', barberId: 'barber_003', customerName: 'Onur S.', rating: 4, comment: 'Saç sakal kombo başarılı.' },
];

async function seed() {
  console.log('🔥 Firestore seed (upsert) başlatılıyor...\n');

  for (const barber of barbers) {
    const { id, ...data } = barber;
    await setDoc(doc(db, 'barbers', id), { ...data, createdAt: serverTimestamp() }, { merge: true });
    console.log(`✅ ${barber.shopName} (${id})`);
  }

  for (const r of reviews) {
    const { id, ...rest } = r;
    await setDoc(doc(db, 'reviews', id), {
      customerId: 'seed_' + rest.customerName,
      customerName: rest.customerName,
      barberId: rest.barberId,
      appointmentId: 'seed',
      rating: rest.rating,
      qualityRating: rest.rating,
      cleanlinessRating: rest.rating,
      timelinessRating: rest.rating,
      comment: rest.comment,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
  console.log(`\n💬 ${reviews.length} yorum (upsert)`);

  console.log(`\n🎉 ${barbers.length} berber yazıldı (hiçbir şey silinmedi).`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
