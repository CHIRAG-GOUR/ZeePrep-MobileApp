# ZeePrep - Mobile Application

A standalone, phone-first mobile application built for students and teachers using **React Native**, **Expo Router**, **TypeScript**, and **Firebase**.

---

## 📱 Project Overview

The ZeePrep Mobile Application connects to the existing **ZeePrep production Firebase backend** (`zeeprep01`) to provide a native mobile experience for students taking assessments, reviewing diagnostic performance reports, viewing leaderboards, and accessing study resources.

- **Target Path:** `E:\1. Skillizee\Zee Prep - Mobile App`
- **Android Package / Application ID:** `com.skillizee.zeeprep`
- **Expo Scheme:** `zeeprep`
- **Firebase Project ID:** `zeeprep01` (Shared with ZeePrep Web App)

---

## 🛠️ Technology Stack

- **Framework:** React Native + Expo (SDK 57)
- **Routing:** Expo Router (File-based navigation)
- **Language:** TypeScript
- **State Management:** Zustand + Expo SecureStore
- **Data Fetching:** TanStack Query v5 + Firebase JS SDK (Auth, Firestore, Storage)
- **Icons & Graphics:** Lucide React Native + React Native SVG
- **Build System:** EAS Build / Expo CLI

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo Go app on mobile device or Android Studio emulator

### Installation & Run

```bash
# Navigate to the mobile project root
cd "E:\1. Skillizee\Zee Prep - Mobile App"

# Install dependencies
npm install

# Start the Expo development server
npx expo start

# Run on Android Emulator
npx expo run:android
```

---

## 🔒 Shared Backend Data Architecture

The mobile application reads and writes directly to the existing ZeePrep Firebase collections:

- `users`: Shared student/teacher profile data and credentials.
- `exams`: Published exams assigned by class, section, and subject.
- `examAttempts`: Real-time exam progress, answer selections, and level telemetry.
- `reports`: Diagnostic performance analytics and scorecards.
- `study_resources`: PDF, DOCX, video, and audio learning resources.
- `notifications`: Real-time announcements and exam alerts.
- `leaderboards`: Subject and class performance rankings.

---

## 📄 License
© 2026 Skillizee / ZeePrep. All rights reserved.
