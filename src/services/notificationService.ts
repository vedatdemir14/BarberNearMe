import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// app.json'daki extra.eas.projectId'yi oku; yoksa fallback
const PROJECT_ID: string =
  Constants.expoConfig?.extra?.eas?.projectId ?? 'fe54ceee-0eb7-46e6-a31b-c948fdb8f4ac';

// Expo Go (SDK 53+) remote push'u desteklemez → orada expo-notifications HİÇ yüklenmesin.
// Statik import yerine guard'lı dinamik import: Expo Go'da konsol hatası çıkmaz.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// ── Push token al ve Firestore'a kaydet (yalnızca dev/gerçek build) ───────────
export async function registerForPushNotifications(uid: string): Promise<void> {
  if (isExpoGo) return; // Expo Go'da çalışmaz, development build gerekir

  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');
    if (!Device.isDevice) return; // emülatörde çalışmaz

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'BarberNearMe',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })).data;
    await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
  } catch (e) {
    console.warn('Push token alınamadı:', e);
  }
}

// ── Kullanıcının push token'ını Firestore'dan oku ─────────────
export async function getUserPushToken(uid: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().expoPushToken ?? null) : null;
  } catch {
    return null;
  }
}

// ── Expo push API ile bildirim gönder (fetch — her ortamda çalışır) ──────────
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<void> {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: expoPushToken, sound: 'default', title, body, data: data ?? {} }),
    });
  } catch (e) {
    console.warn('Bildirim gönderilemedi:', e);
  }
}
