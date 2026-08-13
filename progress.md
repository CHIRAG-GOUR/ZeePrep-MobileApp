# ZeePrep Mobile App — Development Progress & Architecture Log

## Overview
- **Project Directory**: `E:\1. Skillizee\Zee Prep - Mobile App`
- **Target Platform**: Android (Physical Device & Emulator) & iOS
- **Tech Stack**: React Native (Expo SDK 52 / Expo Router v4), TypeScript, Firebase Auth & Firestore, Firebase Storage & Cloud Functions (FFmpeg HLS Transcoding), Expo Audio, Expo Video / ExoPlayer, React Native WebView, NativeWind/Tailwind.
- **Git Repository**: `https://github.com/CHIRAG-GOUR/ZeePrep-MobileApp.git` (Branch: `master`)
- **Release APK**: [Zee Prep.apk](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/Zee%20Prep.apk)

---

## Complete Feature & Progress History

### 1. Project Initialization & Web Isolation
- Initialized dedicated mobile codebase inside `E:\1. Skillizee\Zee Prep - Mobile App`.
- Enforced strict isolation: The original web application (`E:\1. Skillizee\Zee Prep`) remains 100% untouched and read-only.

### 2. Brand Launch Experience & Launcher Icons
- **Launch Screen (`src/components/ZeePrepLaunchScreen.tsx`)**:
  - Implemented light-themed, high-resolution opening splash animation featuring the official ZeePrep logo and glow effects.
- **Dual-Audio Synchronized Engine**:
  - Configured voiceover audio (`Intro.mp3`: *"ZeePrep — Learn. Practice. Perform."*) playing first at loud volume (`1.0`).
  - Added background music (`Intro Music 1.mp3`) harmonizing with the voiceover.
  - Implemented a **Dual Audio Completion Tracker** to ensure both audios finish 100% naturally before fading out into the app.
- **Native Launcher Icons**:
  - Generated native Android adaptive launcher icons (round, foreground, background, monochrome XML) featuring the official "Z" emblem.

### 3. Authentication & Input Layout Refinements
- **Login Screen (`src/app/(auth)/login.tsx`)**:
  - Fixed Faculty ID / Email input field formatting to prevent line wrapping or text truncation across all screen sizes.
  - Role-based navigation for Students, Teachers, Admins, and SuperAdmins.

### 4. Full Device Responsiveness & Auto-Rotation
- **Responsive System (`src/hooks/useResponsive.ts`)**:
  - Built custom hook tracking screen width, height, orientation (Portrait ↕ Landscape), aspect ratio, safe area insets (`safeTop`, `safeBottom`), and keyboard state.
  - Guaranteed every portal, exam grid, modal, and resource viewer dynamically recalculates layout upon rotation without stretching.

### 5. Media Player & Automated HLS Transcoding Engine
- **Single ZeePrep Purple Player**:
  - Disabled native Android ExoPlayer white controls (`nativeControls={false}`) to resolve double-player overlay issues.
  - Built unified ZeePrep purple media player controls with smooth seek bar, play/pause, timecodes, and full-bleed 9:16 vertical video support without letterboxing.
- **Cloud Function HLS Transcoder (`functions/index.js`)**:
  - Implemented `onVideoUploadedHLS` Firebase Cloud Function powered by FFmpeg.
  - Automatically transcodes uploaded MP4/MOV videos into adaptive HLS (`.m3u8`) streams with multi-bitrate renditions (`144p` for weak 2G/3G connections up to `1080p` HD).

### 6. YouTube Native Fullscreen WebView Repair
- **Fullscreen Integration (`src/app/resource/[id].tsx`, `src/components/ResourceViewerModal.tsx`)**:
  - Enabled native fullscreen video playback (`allowsFullscreenVideo={true}`).
  - Added JavaScript DOM event listener bridge for `fullscreenchange` events from YouTube's iframe player.
  - Tapping YouTube's internal bottom-right fullscreen button launches a full-bleed landscape modal overlay for an authentic YouTube mobile experience.
  - Removed top-right duplicate exit fullscreen overlay.

### 7. Per-Question Marks Import & Scoring Pipeline Architecture
- **Question Sheet Parser (`src/utils/question-sheet-importer.ts`)**:
  - Recognizes marks headers: `Marks`, `Mark`, `Question Marks`, `Maximum Marks`, `Max Marks`, `Score`, `Weight`.
  - Normalizes marks value into numeric `marks` field per question.
  - Performs strict validation: requires `marks > 0`. Flag invalid or missing values clearly (e.g. `Question 14 has an invalid marks value: "abc". Please correct the sheet before importing.`). Never silently convert invalid marks to 1 or default.
- **Validation & Preview Modal (`src/components/QuestionSheetUploadModal.tsx`)**:
  - Shows Validation Summary: Valid Questions count, Questions With Errors count, Total Marks sum (`sum(question.marks)`).
  - Displays Preview Card for every row showing Question #, Question Text, Correct Answer, Marks (`+X Marks`), Subject, Topic, Level.
- **Question Bank Integration (`src/app/(teacher)/question-bank.tsx`)**:
  - Displays `Marks: X` for every question in the Question Bank.
  - Manual Question Creation Modal includes required numeric `Marks` field with strict validation.
- **Exam Builder Dynamic Total Marks (`src/app/(teacher)/exam-builder.tsx`)**:
  - When teachers select questions for an exam, `totalMarks` is calculated dynamically as `sum(question.marks)`.
  - Eliminates fixed `N × 1` assumptions.
- **Scoring Engine & Report Summary (`src/services/firestore.ts`, `src/app/results/[id].tsx`)**:
  - Scoring: Correct = `+ question.marks`, Incorrect = `0`, Unanswered = `0`. Minimum score = `0` (Zero negative marking).
  - Total Possible Marks = `sum(question.marks)`.
  - Percentage = `(obtainedMarks / totalMarks) * 100`.
  - Scorecard & Question Breakdown displays Question Marks, Awarded Marks (+X, 0), Correct/Incorrect/Unanswered counts, Total Questions, and Total Possible Marks.
- **Gemini AI Diagnostic Insights Integration (`src/services/ai.ts`)**:
  - `generateTeacherAIReportAnalysis` receives complete question-level marks and weight loss telemetry, allowing Gemini AI to distinguish between losing 5 marks on a high-weight question vs 1 mark on a low-weight question.

### 8. Dynamic Role-Based Screen Protection (SuperAdmin Exemption)
- **Native Android Module (`ScreenSecurityModule.kt`)**:
  - Built Kotlin React Native bridge module `ScreenSecurityModule` with `@ReactMethod fun allowScreenshots(allow: Boolean)`.
- **Role Control Logic (`src/utils/security-helper.ts`)**:
  - **SuperAdmins (`user.role === "superadmin"`)**: Calls `ScreenSecurityModule.allowScreenshots(true)` which clears `FLAG_SECURE`. SuperAdmins can take screenshots and record screen content.
  - **All Other Roles (Students, Teachers, Admins, Guests)**: Enforces `FLAG_SECURE` (`ScreenSecurityModule.allowScreenshots(false)`), blocking all screenshots and screen recordings across the app.

### 9. Enterprise Anti-Tampering & Security Hardening
- **ProGuard / R8 Bytecode Obfuscation**:
  - Configured `android.enableMinifyInReleaseBuilds=true` and `android.enableShrinkResourcesInReleaseBuilds=true` in `gradle.properties` and `build.gradle`.
  - Scrambled Kotlin/Java symbol names and stripped debug log statements (`Log.d`, `Log.v`, `Log.i`).
- **Hermes Bytecode Compilation**:
  - Compiled JavaScript source code into pre-compiled Hermes binary bytecode (`.hbc`).

### 10. Native Release Build & Git Deployment
- **TypeScript Check**: `npx tsc --noEmit` -> **0 errors**.
- **Gradle Release Compilation**: `gradlew assembleRelease` succeeded (`BUILD SUCCESSFUL in 1m 48s`).
- **Physical Device Installation**: Installed on connected device (`Performing Streamed Install -> Success`).
- **Git Version Control**: Pushed commit `e15cb43` to `origin/master`.

---

## Key Project File Map
- **Question Sheet Parser**: [question-sheet-importer.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/utils/question-sheet-importer.ts)
- **Validation & Preview Modal**: [QuestionSheetUploadModal.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/components/QuestionSheetUploadModal.tsx)
- **Question Bank Screen**: [question-bank.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(teacher)/question-bank.tsx)
- **Exam Builder Screen**: [exam-builder.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(teacher)/exam-builder.tsx)
- **Screen Security Native Module**: [ScreenSecurityModule.kt](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/android/app/src/main/java/com/skillizee/zeeprep/ScreenSecurityModule.kt)
- **Exam Engine Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/exam/%5Bid%5D.tsx)
- **Exam Results & Report Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/results/%5Bid%5D.tsx)
- **Release APK**: [Zee Prep.apk](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/Zee%20Prep.apk)
