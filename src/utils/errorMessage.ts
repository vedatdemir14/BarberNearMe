// Firebase/teknik hataları kullanıcının diliyle (Türkçe) anlaşılır mesaja çevirir.
// Design contract: "kullanıcının dilinden konuş" + "hatadan kurtulmaya yardım et".
const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/invalid-email': 'Geçersiz e-posta adresi.',
  'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
  'auth/wrong-password': 'Şifre hatalı.',
  'auth/missing-password': 'Lütfen şifreni gir.',
  'auth/email-already-in-use': 'Bu e-posta zaten kullanımda. Giriş yapmayı dene.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene.',
  'auth/network-request-failed': 'İnternet bağlantısı yok. Bağlantını kontrol et.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
  'permission-denied': 'Bu işlem için yetkin yok.',
  'unavailable': 'Sunucuya ulaşılamıyor. Bağlantını kontrol et.',
};

export function friendlyError(e: any, fallback = 'Bir sorun oluştu. Lütfen tekrar dene.'): string {
  const code: string = e?.code ?? '';
  if (MESSAGES[code]) return MESSAGES[code];
  // Türkçe/anlamlı bir mesaj varsa onu göster, yoksa teknik İngilizce yerine fallback
  const msg: string = e?.message ?? '';
  if (msg && !/firebase|auth\/|error \(/i.test(msg)) return msg;
  return fallback;
}
