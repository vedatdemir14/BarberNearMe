/**
 * Montella Barber Shop için mock müşteriler + randevular ekler.
 * Çalıştır: node scripts/seed-montella-appointments.mjs
 *
 * UPSERT: Sabit id'lerle yazar; tekrar çalıştırınca çoğaltmaz, günceller.
 * Randevular: Bekleyen, Onaylı, Tamamlandı, İptal durumlarının her birinde 2-3 adet.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
  Timestamp,
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

// ── Mock müşteriler ──────────────────────────────────────────────
const MOCK_CUSTOMERS = [
  { id: 'mock_cust_1', firstName: 'Ahmet',   lastName: 'Yılmaz',  phone: '0532 111 22 33' },
  { id: 'mock_cust_2', firstName: 'Mert',    lastName: 'Kaya',    phone: '0533 222 33 44' },
  { id: 'mock_cust_3', firstName: 'Emre',    lastName: 'Demir',   phone: '0534 333 44 55' },
  { id: 'mock_cust_4', firstName: 'Burak',   lastName: 'Şahin',   phone: '0535 444 55 66' },
  { id: 'mock_cust_5', firstName: 'Onur',    lastName: 'Çelik',   phone: '0536 555 66 77' },
];

// gün ofseti (bugünden) → Timestamp; saat verilebilir
function ts(dayOffset, hour = 10, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return Timestamp.fromDate(d);
}

async function findMontella() {
  const snap = await getDocs(collection(db, 'barbers'));
  const match = snap.docs.find(d => (d.data().shopName ?? '').toLowerCase().includes('montella'));
  return match ? { id: match.id, ...match.data() } : null;
}

async function run() {
  const shop = await findMontella();
  if (!shop) {
    console.error('❌ Montella berberi bulunamadı. Önce Montella dükkanının Firestore\'da olduğundan emin ol.');
    process.exit(1);
  }
  console.log(`✅ Montella bulundu: ${shop.shopName} (${shop.id})`);

  const services = shop.services?.length ? shop.services : [
    { id: 's1', name: 'Saç', price: 400, durationMin: 30 },
    { id: 's2', name: 'Sakal', price: 250, durationMin: 20 },
    { id: 's3', name: 'Saç + Sakal', price: 600, durationMin: 50 },
  ];
  const staff = shop.staff?.length ? shop.staff : [
    { id: 'st1', name: 'Usta', title: 'Usta Berber' },
  ];

  const pick = (arr, i) => arr[i % arr.length];

  // Mock müşterileri yaz
  for (const c of MOCK_CUSTOMERS) {
    await setDoc(doc(db, 'users', c.id), {
      uid: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: `${c.id}@example.com`,
      phone: c.phone,
      role: 'customer',
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
  console.log(`✅ ${MOCK_CUSTOMERS.length} mock müşteri yazıldı.`);

  // Durum dağılımı: her birinde 2-3 randevu
  // [status, dayOffset, hour, cancelledBy?]
  const plan = [
    // Bekleyen (gelecek) — 3
    { status: 'pending',   day: 1, hour: 10, min: 0 },
    { status: 'pending',   day: 2, hour: 14, min: 30 },
    { status: 'pending',   day: 3, hour: 16, min: 0 },
    // Onaylı (gelecek) — 3
    { status: 'confirmed', day: 1, hour: 11, min: 0 },
    { status: 'confirmed', day: 2, hour: 15, min: 30 },
    { status: 'confirmed', day: 4, hour: 13, min: 0 },
    // Tamamlandı (geçmiş) — 3
    { status: 'completed', day: -2, hour: 12, min: 0 },
    { status: 'completed', day: -5, hour: 17, min: 0 },
    { status: 'completed', day: -8, hour: 10, min: 30 },
    // İptal (geçmiş) — 2
    { status: 'cancelled', day: -1, hour: 9,  min: 30, cancelledBy: 'customer' },
    { status: 'cancelled', day: -3, hour: 18, min: 0,  cancelledBy: 'barber' },
  ];

  let i = 0;
  let walletTotal = 0;
  for (const p of plan) {
    const svc = pick(services, i);
    const stf = pick(staff, i);
    const cust = pick(MOCK_CUSTOMERS, i);
    const price = svc.price ?? 0;
    const kapora = Math.round(price * 0.1);
    const id = `mock_montella_appt_${i + 1}`;
    await setDoc(doc(db, 'appointments', id), {
      customerId: cust.id,
      customerName: `${cust.firstName} ${cust.lastName}`,
      barberId: shop.id,
      staffId: stf.id,
      staffName: stf.name,
      serviceId: svc.id,
      serviceName: svc.name,
      servicePrice: price,
      date: ts(p.day, p.hour, p.min),
      timeSlot: `${String(p.hour).padStart(2, '0')}:${String(p.min).padStart(2, '0')}`,
      durationMin: svc.durationMin ?? 30,
      status: p.status,
      ...(p.cancelledBy ? { cancelledBy: p.cancelledBy } : {}),
      kaporaPaid: true,
      kaporaAmount: kapora,
      totalPrice: price,
      createdAt: serverTimestamp(),
    });
    // Cüzdan: kapora rezervasyonda; tamamlananlarda kalan ücret de eklenir
    walletTotal += kapora + (p.status === 'completed' ? (price - kapora) : 0);
    i++;
  }
  console.log(`✅ ${plan.length} randevu yazıldı (bekleyen 3, onaylı 3, tamamlandı 3, iptal 2).`);

  // Montella cüzdan bakiyesini mock randevulara göre ayarla
  await setDoc(doc(db, 'barbers', shop.id), { walletBalance: walletTotal }, { merge: true });
  console.log(`✅ Cüzdan bakiyesi ₺${walletTotal} olarak ayarlandı (kapora + tamamlanan iş geliri).`);
  console.log('🎉 Tamamlandı.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
