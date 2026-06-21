import {
  collection, doc, setDoc, addDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp,
  Timestamp, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserPushToken, sendPushNotification } from './notificationService';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
}

export interface Chat {
  id: string;
  barberId: string;
  customerId: string;
  barberName: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: Timestamp | null;
}

// chatId her zaman deterministik: barberId_customerId
export function chatId(barberId: string, customerId: string) {
  return `${barberId}_${customerId}`;
}

// ── Sohbet oluştur ya da var olanı döndür ────────────────────
export async function ensureChat(
  barberId: string,
  customerId: string,
  barberName: string,
  customerName: string,
): Promise<string> {
  const id  = chatId(barberId, customerId);
  const ref = doc(db, 'chats', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      barberId, customerId, barberName, customerName,
      lastMessage: '', lastMessageAt: null,
    });
  }
  return id;
}

// ── Mesaj gönder ──────────────────────────────────────────────
export async function sendMessage(
  cId: string,
  senderId: string,
  text: string,
): Promise<void> {
  const msgRef = collection(db, 'chats', cId, 'messages');
  await addDoc(msgRef, { senderId, text, createdAt: serverTimestamp() });

  const chatRef = doc(db, 'chats', cId);
  await updateDoc(chatRef, { lastMessage: text, lastMessageAt: serverTimestamp() });

  // Alıcıya bildirim gönder
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    const chat = chatSnap.data();
    const recipientId = senderId === chat.barberId ? chat.customerId : chat.barberId;
    const senderName  = senderId === chat.barberId ? chat.barberName : chat.customerName;
    getUserPushToken(recipientId).then(token => {
      if (token) sendPushNotification(token, `💬 ${senderName}`, text.length > 60 ? text.slice(0, 60) + '…' : text, { cId });
    }).catch(() => {});
  }
}

// ── Sohbeti (bir dükkanla tüm konuşmayı) sil ─────────────────
export async function deleteChat(cId: string): Promise<void> {
  // Önce alt koleksiyondaki mesajları sil
  const msgs = await getDocs(collection(db, 'chats', cId, 'messages'));
  await Promise.all(msgs.docs.map(d => deleteDoc(doc(db, 'chats', cId, 'messages', d.id))));
  // Sonra sohbet dokümanını sil
  await deleteDoc(doc(db, 'chats', cId));
}

// ── Gerçek zamanlı mesaj dinleyici ───────────────────────────
export function subscribeToMessages(
  cId: string,
  callback: (msgs: ChatMessage[]) => void,
): () => void {
  const q = query(
    collection(db, 'chats', cId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, snap => {
    callback(
      snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage))
    );
  });
}

// ── Kullanıcının tüm sohbetleri ───────────────────────────────
export async function getChatsForBarber(barberId: string): Promise<Chat[]> {
  const q = query(collection(db, 'chats'), where('barberId', '==', barberId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Chat))
    .sort((a, b) => {
      const ta = a.lastMessageAt?.seconds ?? 0;
      const tb = b.lastMessageAt?.seconds ?? 0;
      return tb - ta;
    });
}

export async function getChatsForCustomer(customerId: string): Promise<Chat[]> {
  const q = query(collection(db, 'chats'), where('customerId', '==', customerId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Chat))
    .sort((a, b) => {
      const ta = a.lastMessageAt?.seconds ?? 0;
      const tb = b.lastMessageAt?.seconds ?? 0;
      return tb - ta;
    });
}
