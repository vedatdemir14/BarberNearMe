/**
 * BarberNearMe – Firestore Mock Data Seeder
 * Çalıştırmak için: node seed.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
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
const db  = getFirestore(app);

// ─── Mock Barbers ────────────────────────────────────────────────────────────
const barbers = [
  {
    id: 'barber_001',
    ownerId: 'mock_owner_1',
    shopName: "Sirat's Barber Shop",
    email: 'sirat@example.com',
    phone: '0532 111 22 33',
    address: 'Bağdat Cad. No:12',
    neighborhood: 'Kadıköy',
    city: 'İstanbul',
    country: 'TR',
    location: new GeoPoint(40.9905, 29.0467),
    photoURLs: [],
    licenseURL: '',
    services: [
      { id: 's1', name: 'Saç Kesimi',      price: 500, durationMin: 30 },
      { id: 's2', name: 'Sakal Düzeltme',  price: 350, durationMin: 20 },
      { id: 's3', name: 'Çocuk Kesimi',    price: 350, durationMin: 25 },
    ],
    staff: [
      { id: 'st1', name: 'Engyal T.', title: 'Kıdemli Berber' },
      { id: 'st2', name: 'Murat A.',  title: 'Berber' },
    ],
    workingHours: { days: [0,1,2,3,4,5], openTime: '09:00', closeTime: '21:00', slotDurationMin: 30 },
    rating: 4.9,
    reviewCount: 128,
    isActive: true,
  },
  {
    id: 'barber_002',
    ownerId: 'mock_owner_2',
    shopName: "Classic Cut Studio",
    email: 'classiccut@example.com',
    phone: '0533 222 33 44',
    address: 'Nişantaşı Mah. No:7',
    neighborhood: 'Şişli',
    city: 'İstanbul',
    country: 'TR',
    location: new GeoPoint(41.0490, 28.9948),
    photoURLs: [],
    licenseURL: '',
    services: [
      { id: 's1', name: 'Saç Kesimi',  price: 300, durationMin: 30 },
      { id: 's2', name: 'Full Tıraş',  price: 400, durationMin: 45 },
      { id: 's3', name: 'Keratin',     price: 900, durationMin: 90 },
    ],
    staff: [
      { id: 'st1', name: 'Mehmet K.', title: 'Usta Berber' },
    ],
    workingHours: { days: [0,1,2,3,4,5,6], openTime: '08:00', closeTime: '19:00', slotDurationMin: 30 },
    rating: 4.7,
    reviewCount: 210,
    isActive: true,
  },
  {
    id: 'barber_003',
    ownerId: 'mock_owner_3',
    shopName: "Brian's Barber",
    email: 'brians@example.com',
    phone: '0535 333 44 55',
    address: 'İstiklal Cad. No:45',
    neighborhood: 'Beyoğlu',
    city: 'İstanbul',
    country: 'TR',
    location: new GeoPoint(41.0328, 28.9772),
    photoURLs: [],
    licenseURL: '',
    services: [
      { id: 's1', name: 'Saç Kesimi',     price: 350, durationMin: 30 },
      { id: 's2', name: 'Sakal Şekillendirme', price: 250, durationMin: 20 },
    ],
    staff: [
      { id: 'st1', name: 'Volkan B.', title: 'Berber' },
      { id: 'st2', name: 'Tarık D.',  title: 'Berber' },
    ],
    workingHours: { days: [0,1,2,3,4,5], openTime: '10:00', closeTime: '20:00', slotDurationMin: 30 },
    rating: 4.2,
    reviewCount: 84,
    isActive: true,
  },
  {
    id: 'barber_004',
    ownerId: 'mock_owner_4',
    shopName: 'Royal Erkek Kuaförü',
    email: 'royal@example.com',
    phone: '0537 444 55 66',
    address: 'Bağlarbaşı Cad. No:22',
    neighborhood: 'Üsküdar',
    city: 'İstanbul',
    country: 'TR',
    location: new GeoPoint(41.0250, 29.0150),
    photoURLs: [],
    licenseURL: '',
    services: [
      { id: 's1', name: 'Saç Kesimi',     price: 250, durationMin: 30 },
      { id: 's2', name: 'Sakal Tıraşı',   price: 200, durationMin: 20 },
      { id: 's3', name: 'Çocuk Kesimi',   price: 200, durationMin: 25 },
      { id: 's4', name: 'Fön & Şekil',    price: 150, durationMin: 20 },
    ],
    staff: [
      { id: 'st1', name: 'Hasan Y.',  title: 'Usta Berber' },
      { id: 'st2', name: 'Emre Ş.',   title: 'Berber' },
      { id: 'st3', name: 'Kemal T.',  title: 'Kalfa' },
    ],
    workingHours: { days: [0,1,2,3,4,5,6], openTime: '07:30', closeTime: '21:00', slotDurationMin: 30 },
    rating: 4.5,
    reviewCount: 312,
    isActive: true,
  },
  {
    id: 'barber_005',
    ownerId: 'mock_owner_5',
    shopName: 'Prestige Hair & Beard',
    email: 'prestige@example.com',
    phone: '0539 555 66 77',
    address: 'Bagdat Cad. No:89',
    neighborhood: 'Beşiktaş',
    city: 'İstanbul',
    country: 'TR',
    location: new GeoPoint(41.0422, 29.0093),
    photoURLs: [],
    licenseURL: '',
    services: [
      { id: 's1', name: 'Saç Kesimi',        price: 650, durationMin: 45 },
      { id: 's2', name: 'Sakal Tasarımı',    price: 500, durationMin: 30 },
      { id: 's3', name: 'Saç & Sakal Kombo', price: 1000, durationMin: 60 },
      { id: 's4', name: 'Cilt Bakımı',       price: 800, durationMin: 60 },
    ],
    staff: [
      { id: 'st1', name: 'Alper M.',   title: 'Baş Stilist' },
      { id: 'st2', name: 'Serkan K.',  title: 'Kıdemli Berber' },
    ],
    workingHours: { days: [0,1,2,3,4,5], openTime: '10:00', closeTime: '22:00', slotDurationMin: 30 },
    rating: 4.8,
    reviewCount: 176,
    isActive: true,
  },
];

// ─── Seed ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🔥 Firestore seed başlatılıyor...\n');

  for (const barber of barbers) {
    const { id, ...data } = barber;
    await setDoc(doc(db, 'barbers', id), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`✅ ${barber.shopName} (${id}) eklendi`);
  }

  console.log(`\n🎉 ${barbers.length} berber başarıyla Firestore'a yüklendi!`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
