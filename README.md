# 💈 BarberNearMe

A cross-platform mobile app to **find nearby barbershops, book appointments, and leave reviews** — built with Expo / React Native and Firebase.

> IZTECH · CENG318 term project (Group 19).

---

## Overview

BarberNearMe connects customers with barbershops. Customers browse shops on a map or list, filter by proximity / rating / price / open-now, view shop details, book a time slot, manage their appointments, and rate completed visits. Barbers can register their shop (onboarding flow is in progress).

## Features

**Customer**
- 🗺️ Discover barbershops on an interactive map (OpenStreetMap tiles) or as a list
- 🔎 Search by shop/neighborhood + filters: *Nearby, Top Rated, Open Now, Best Price*
- 🏪 Shop detail: staff, services, working hours, reviews
- 📅 Book an appointment — real services, calendar, and **booked slots are disabled** to prevent double-booking
- 🗂️ My Appointments — upcoming / past / cancelled, with status badges
- ⭐ Rate & review completed appointments
- 👤 Profile backed by the signed-in account

**Barber**
- 🧾 Multi-step shop registration *(work in progress — screens are stubbed)*

**In progress / mocked**
- 💬 Messaging screen (UI only, not yet backed by Firestore)
- 🛠️ Role-based navigation & barber dashboard

## Tech Stack

| Area | Tech |
|------|------|
| Framework | Expo SDK 54, React Native 0.81, React 19 |
| Language | TypeScript |
| Backend | Firebase Auth + Cloud Firestore |
| Navigation | React Navigation 7 (native-stack + bottom-tabs) |
| Maps | react-native-maps |
| State / utils | zustand, date-fns |

## Project Structure

```
src/
├── constants/     # colors, app-wide constants
├── hooks/         # useAuth (auth state + profile)
├── navigation/    # central navigator + typed RootStackParamList
├── services/      # Firebase data layer (auth, barber, appointment, review)
└── screens/
    ├── auth/      # Intro, Login, SignUp
    ├── customer/  # Home, BarberDetail, Appointment, Confirm, List, Rating, Profile, Messaging
    └── barber/    # Registration steps (WIP)
App.tsx · index.ts · seed.mjs · app.json · eas.json
```

The UI never talks to Firebase directly — all reads/writes go through `src/services/*`.

## Data Model (Firestore)

| Collection | Purpose |
|------------|---------|
| `users` | User profile (`firstName`, `lastName`, `email`, `phone`, `role`) |
| `barbers` | Shop info, `services[]`, `staff[]`, `workingHours`, `location`, `rating` |
| `appointments` | Booking: customer, barber, staff, service, `date`, `timeSlot`, `status` |
| `reviews` | Rating + comment, linked to an appointment & barber |

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (Authentication with Email/Password + Firestore enabled)
- Expo Go on a device, or an Android/iOS emulator

### 1. Install
```bash
npm install
```

### 2. Configure environment
Copy the example file and fill in your Firebase web-app config:
```bash
cp .env.example .env
```
```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```
> Without a valid `.env`, sign-in/sign-up won't work and you'll be stuck on the auth screens.

### 3. Run
```bash
npx expo start
```
Then press `w` (web), `a` (Android emulator), `i` (iOS simulator — macOS), or scan the QR code with **Expo Go**.

### 4. (Optional) Seed sample data
Populate Firestore with demo barbershops so the Home screen shows real data:
```bash
node seed.mjs
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Expo dev server |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS |
| `npm run web` | Open in the browser |

## Known Limitations / Roadmap

- [ ] Implement barber registration steps (1–4) and activate shops
- [ ] Role-based navigation + barber dashboard (appointment management)
- [ ] Real-time messaging via Firestore (`onSnapshot`)
- [ ] Firestore security rules
- [ ] Resolve dependency/version warnings (`expo-font`, `expo-dev-client`, reanimated) and add `babel.config.js`
- [ ] Tests, linting, and CI

## License

Educational project — not licensed for production use.
