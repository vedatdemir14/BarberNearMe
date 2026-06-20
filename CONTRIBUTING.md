# 🤝 Geliştirme Rehberi & Dikkat Edilecekler

Bu dosya, herkesin repoyla sorunsuz çalışması için yazıldı. **Lütfen kod yazmadan önce oku.**

---

## 1. 🌿 Branch kuralları (EN ÖNEMLİSİ)

- **`main`'e ASLA doğrudan commit/push yapma.** `main` = kararlı, çalışan, sunuma hazır sürüm.
- **`dev`** = günlük geliştirmenin toplandığı yer.
- Her iş **kendi feature branch'inde** yapılır:

```bash
git checkout dev
git pull                          # her zaman güncel dev'den başla
git switch -c feature/<isim>      # ör: feature/berber-panel
# ... kod yaz, commit at ...
git push -u origin feature/<isim>
```

- İş bitince **GitHub'da PR aç → `dev`'e** merge et.
- `dev` kararlıyken → **PR ile `dev` → `main`**.

Akış: `feature/x → PR → dev → (kararlıyken) PR → main`

> 🔒 Öneri: GitHub → Settings → Branches → `main`'e **branch protection** ekleyin (PR zorunlu olsun). Böylece kimse yanlışlıkla main'e direkt push edemez.

İsimlendirme: `feature/...` (yeni özellik), `fix/...` (hata düzeltme).

---

## 2. ▶️ Uygulamayı çalıştırma (en kolay yol)

```bash
git checkout dev && git pull
npm install
npx expo start        # telefonda Expo Go ile QR'ı tara
```

- **Expo Go'da harita + Firebase otomatik çalışır**, ekstra anahtar/kurulum gerekmez.
- Test hesabı: **`demo@barbernearme.com` / `demo123456`**
- Bilgisayar ile telefon **aynı WiFi'da** olsun.

---

## 3. 📦 Build (APK) hangi branch'ten alınır?

- **Bulunduğun branch'ten** alınır (`main`/`dev` otomatik değil). Build'den önce:
  ```bash
  git checkout dev && git pull
  ```
- **`main`'den build almayın** (şu an kırık olabilir — aşağıdaki reanimated notuna bak).
- APK için Google Maps anahtarı gerekir; o `app.json`'da **lokal** (repoda yok). Expo Go'da gerekmez.

---

## 4. ⚠️ TUZAKLAR — bunlara dikkat

1. **`react-native-reanimated` EKLEMEYİN / geri getirmeyin.**
   - Bilerek kaldırıldı: RN 0.81 + **eski mimari (`newArchEnabled: false`)** ile native build'i **çökertiyor**, ve kodda kullanılmıyor.
   - `npx expo install --fix` gibi komutlar onu **kazara geri ekleyebilir**. `package.json`'da `react-native-reanimated` / `react-native-worklets-core` görürsen **çıkar**.

2. **`app.json`'u commit etmeyin.**
   - İçinde lokal Maps anahtarı + EAS projectId var. Sırları repoya koymayın.

3. **Native paket sürümlerini elle değiştirmeyin.**
   - Paket eklerken `npx expo install <paket>` kullanın (SDK 54 uyumlu sürümü seçer). Elle `npm install x@latest` build'i bozabilir.

4. **`seed.mjs` artık silmiyor (upsert).**
   - Çalıştırınca var olanları korur, ekler/günceller. Yeni berber: diziye **benzersiz id'li** nesne ekle → `node seed.mjs`.

5. **Firestore ortak.**
   - Tek veritabanı (`barbernearme-b86c8`). Herkesin uygulaması aynı veriye yazar/okur. Bilerek silme yapma.

---

## 5. 🔥 Firestore sorgu kuralı

- Sorgularda **`where` + `orderBy` (farklı alan) BİRLİKTE kullanmayın** → Firestore "composite index" ister, `failed-precondition` hatası alırsınız.
- Bunun yerine: **tek `where` ile çek, sıralamayı/filtreyi JS'te yap** (mevcut servisler böyle yazılı).

---

## 6. 📁 Proje yapısı (kısa)

```
src/services/    → Firebase katmanı (auth, barber, appointment, review, conversation)
src/screens/     → auth / customer / barber ekranları
src/navigation/  → merkezi yönlendirme (RootStackParamList)
src/hooks/       → useAuth
seed.mjs         → örnek berber/yorum verisi (upsert)
```

UI hiçbir zaman Firebase'i doğrudan çağırmaz — her şey `services/` üzerinden gider.

---

## 7. 🧑‍🔧 Berber tarafı yapacaklar için hazır yardımcılar

- `authService.registerBarber` → rol=barber + kısmi `barbers` dokümanı oluşturur.
- `barberService` → `updateBarberServices`, `updateBarberLocation`, `updateBarberHoursAndActivate`.
- `appointmentService.getBarberAppointments(barberId)` → berberin randevuları.
- `appointmentService.updateAppointmentStatus(id, 'confirmed'|'completed'|'cancelled')`.
- Rol yönlendirme: `navigation/index.tsx` içinde `useAuth().profile.role` ile customer/barber ayrımı yapılabilir.

---

Sorun yaşarsan önce `git checkout dev && git pull && npm install` dene. Takılırsan grupta yaz 🙌
