import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Conversation {
  id: string;
  customerId: string;
  barberId: string;
  barberName: string;
  lastMessage: string;
  lastAt: any;
}

export interface Message {
  id: string;
  conversationId: string;
  text: string;
  senderRole: 'customer' | 'barber';
  createdAt: any;
}

// Aynı müşteri+berber tek bir konuşmaya denk gelsin diye deterministik id
function convId(customerId: string, barberId: string) {
  return `${customerId}__${barberId}`;
}

// Konuşmayı bul; yoksa oluştur. id döner.
export async function getOrCreateConversation(
  customerId: string,
  barberId: string,
  barberName: string
): Promise<string> {
  const id = convId(customerId, barberId);
  const ref = doc(db, 'conversations', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      customerId,
      barberId,
      barberName,
      lastMessage: '',
      lastAt: serverTimestamp(),
    });
  }
  return id;
}

// Müşterinin konuşmaları (sıralama JS'te — composite index gerektirmesin)
export async function getConversations(customerId: string): Promise<Conversation[]> {
  const q = query(collection(db, 'conversations'), where('customerId', '==', customerId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Conversation))
    .filter(c => !!c.lastMessage) // boş (hiç mesajlaşılmamış) konuşmaları gizle
    .sort((a, b) => (b.lastAt?.toMillis?.() ?? 0) - (a.lastAt?.toMillis?.() ?? 0));
}

// Bir konuşmanın mesajlarını canlı dinle (gerçek zamanlı)
export function subscribeMessages(
  conversationId: string,
  cb: (msgs: Message[]) => void
) {
  const q = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
  return onSnapshot(q, snap => {
    const msgs = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Message))
      // Pending serverTimestamp'i en sona koy (yeni mesaj altta görünsün)
      .sort((a, b) => (a.createdAt?.toMillis?.() ?? Date.now()) - (b.createdAt?.toMillis?.() ?? Date.now()));
    cb(msgs);
  });
}

// Mesaj gönder + konuşmanın son mesaj/saat özetini güncelle
export async function sendMessage(
  conversationId: string,
  text: string,
  senderRole: 'customer' | 'barber' = 'customer'
): Promise<void> {
  await addDoc(collection(db, 'messages'), {
    conversationId,
    text,
    senderRole,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: text,
    lastAt: serverTimestamp(),
  });
}

// Konuşmayı ve içindeki tüm mesajları sil
export async function deleteConversation(conversationId: string): Promise<void> {
  const q = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'conversations', conversationId));
}
