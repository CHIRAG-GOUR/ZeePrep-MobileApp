# ZeePrep — Two-Branch Release & Production Deployment Guide
> **Repository:** `CHIRAG-GOUR/ZeePrep-MobileApp` | **Package ID:** `com.skillizee.zeeprep` | **Firebase:** `zeeprep01`

This document defines the **Two-Branch Intentional Release Architecture** for ZeePrep:
1. **Web Branch (`master`):** Dedicated to the ZeePrep Web App (Hostinger FTPS).
2. **Play Console Branch (`play-console`):** Dedicated to Android Google Play Store (Internal Testing).

---

## 🏗️ 1. Two-Branch Architecture Overview

```
                            GITHUB REPOSITORY
                     (CHIRAG-GOUR/ZeePrep-MobileApp)
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│     BRANCH 1: WEB RELEASE     │         │ BRANCH 2: PLAY STORE RELEASE  │
│        (master / main)        │         │        (play-console)         │
├───────────────────────────────┤         ├───────────────────────────────┤
│ Trigger: Push to master       │         │ Trigger: Push to play-console │
│ Action:  deploy-hostinger.yml │         │ Action:  play-console.yml     │
│                               │         │                               │
│ 1. TypeScript & Lint check    │         │ 1. TypeScript & Lint check    │
│ 2. Expo Web Export (dist/)    │         │ 2. Native Gradle bundleRelease│
│ 3. Inject SPA .htaccess       │         │ 3. Compile signed .aab        │
│ 4. Upload to Hostinger FTPS   │         │ 4. Upload to Google Play      │
│                               │         │    Internal Testing Track     │
│ ➔ Live Website Updated        │         │ ➔ Play Store Internal Updated │
└───────────────────────────────┘         └───────────────────────────────┘
           │                                                 │
           ▼                                                 ▼
 🛑 NO Android build triggered                     🛑 NO Web deploy triggered
```

### Strict Isolation Invariants:
- **Pushing to `master`** updates the **Web App only** on Hostinger. It NEVER touches Android or Google Play.
- **Pushing to `play-console`** compiles the **Android `.aab` only** and uploads it to Google Play Internal Testing. It NEVER touches the website.
- **Normal development work** happens in your working branch. Deployments only occur when code is intentionally pushed/merged into `master` or `play-console`.

---

## 📱 2. Android Play Console Workflow (`play-console` branch)

### 📋 Release Process:
When you have tested an update and want to release it to Google Play Store:

```bash
# 1. Ensure version and versionCode are updated in app.json & android/app/build.gradle
# 2. Checkout or switch to play-console branch
git checkout -B play-console

# 3. Merge or copy your tested release state
git merge master   # (or your working branch)

# 4. Push to play-console branch
git push origin play-console
```

### ⚡ What Happens Automatically in GitHub Actions (`play-console.yml`):
1. Runs TypeScript verification (`npm run typecheck`) and ESLint (`npm run lint`).
2. Validates package ID (`com.skillizee.zeeprep`), `versionName`, and `versionCode`.
3. Compiles the signed release bundle via native Gradle (`./gradlew bundleRelease`).
4. Verifies `android/app/build/outputs/bundle/release/app-release.aab` exists.
5. Uploads the `.aab` directly to the **Google Play Internal Testing Track**.
6. Retains the `.aab` as a downloadable artifact in the GitHub Actions run.

### 🛑 Manual Promotion Gate:
- Internal testers receive the build on their devices via Google Play Store.
- After testing, you manually click **Promote release ➔ Production** in Google Play Console.

---

## ⚡ 3. Fast Local Development Loop (No Cloud Build)

For rapid local iteration, test directly on your connected Android phone using ADB:

```cmd
:: One-click compile Release APK and install to USB-connected phone:
scripts\build-and-install-android.bat
```

Or manually:
```bash
# Compile APK locally in seconds
cd android
gradlew.bat assembleRelease -x lint -x test

# Install to connected device
adb devices
adb install -r app/build/outputs/apk/release/app-release.apk

# Launch app
adb shell am start -n com.skillizee.zeeprep/.MainActivity
```

---

## 🌐 4. Web Deployment Workflow (`master` branch)

When you push code to `master`, GitHub Actions automatically runs `.github/workflows/deploy-hostinger.yml`:
1. Typecheck & Lint validation.
2. Static web export to `dist/` via `npm run build:web`.
3. Injects SPA `.htaccess` routing rules.
4. Uploads to Hostinger web server (`public_html/`) via FTPS.

### Manual Web Commands:
```bash
# Local web preview server
npm run web

# Deploy directly to Hostinger
npm run deploy:hostinger

# Deploy directly to Firebase Hosting (zeeprep-app)
npm run deploy:web
```

---

## 🔄 5. Versioning Rules for Play Store Releases

For every new Play Store upload, increment `version` and `versionCode` in **both** files before pushing to `play-console`:

1. In [`app.json`](file:///e:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/app.json):
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "android": {
         "versionCode": 2
       }
     }
   }
   ```
2. In [`android/app/build.gradle`](file:///e:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/android/app/build.gradle):
   ```groovy
   defaultConfig {
       versionCode 2
       versionName "1.0.1"
   }
   ```

---

## 🔐 6. Required GitHub Secrets

Configure these in **GitHub Repository Settings** (`Settings` > `Secrets and variables` > `Actions`):

| Secret Name | Purpose | Used In |
|---|---|---|
| `FTP_HOST` | Hostinger FTP Hostname / IP | Web Deploy |
| `FTP_USERNAME` | Hostinger FTP Username | Web Deploy |
| `FTP_PASSWORD` | Hostinger FTP Password | Web Deploy |
| `FTP_TARGET_DIR` | Hostinger Directory (`public_html/`) | Web Deploy |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | Web Deploy |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Web Deploy |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID (`zeeprep01`) | Web Deploy |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Web Deploy |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging Sender ID | Web Deploy |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | Web Deploy |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Gemini AI API Key | Web Deploy |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play Developer API Service Account | Play Console Deploy |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `my-release-key.keystore` | Play Console Deploy (Optional) |
