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

### 7. Exam Engine & Scoring System Complete Repair (TASK 1 & TASK 2)
- **Removal of Negative Marking at Source (`src/services/firestore.ts`)**:
  - Completely removed negative mark deductions (`q.negativeMarks`) inside `submitStudentExamAttempt`.
  - Correct answer = `+ (q.marks || 1)`, Incorrect = `0`, Unattempted = `0`.
  - Enforced `obtainedMarks = Math.max(0, obtainedMarks)` so attempt scores and reports are **strictly non-negative** (minimum score = `0`).
  - Updated `mapDocumentToReport` to enforce `Math.max(0, rawObtained)` for backwards compatibility with legacy Firestore attempt records.
- **Mobile Exam Window Redesign (`src/app/exam/[id].tsx`)**:
  - Integrated safe area top insets (`responsive.safeTop`) so exam headers, title, progress text, and live countdown timer pill are never clipped by camera cutouts or notches.
  - Flexible vertical scrolling (`ScrollView`) ensures long questions and options are 100% accessible on all screen sizes (16:9, 19.5:9, 20:9, portrait, landscape).
  - Implemented **Clear Answer** and **Mark for Review** buttons with immediate local draft persistence via `expo-secure-store`.
- **Question Palette Modal**:
  - Added a dedicated **Question Navigator Modal / Bottom Sheet** triggered from header and footer controls.
  - Displays color-coded question nodes: Answered (Green), Review (Gold/Amber), Unanswered (Slate), Active (Primary ring).
  - Enables direct 1-tap jumping to any question without horizontal page overflow.
- **Real Question-Level Timing (`timeSpentPerQuestion`)**:
  - `tickTimer` in `src/stores/exam-store.ts` tracks active seconds per question (`recordQuestionTime`).
  - Preserves accumulated time across question revisit navigation and stores timing in `ExamAttempt` & `Report`.
- **Question-by-Question Analysis (`src/app/results/[id].tsx`)**:
  - Added a structured Question Analysis section rendering question text, student's selected response, correct response, result pill (`✓ Correct (+1 mark)`, `✕ Incorrect (0 marks)`, `Unanswered (0 marks)`), and per-question time taken.
- **Gemini AI Diagnostic Insights**:
  - Displays dynamic Gemini AI diagnostic analysis (`strongTopics`, `weakTopics`, `actionableAdvice`, `recommendation`) with loading indicators and fail-safe offline fallback.
- **Digital Student ID Card (`src/app/(tabs)/profile.tsx`)**:
  - Upgraded student profile screen with a responsive Digital Student ID Card showing School Name, Login ID, Email, Grade, Section, Board, and Stream.

### 8. Enterprise Anti-Tampering & Security Hardening
- **ProGuard / R8 Bytecode Obfuscation**:
  - Configured `android.enableMinifyInReleaseBuilds=true` and `android.enableShrinkResourcesInReleaseBuilds=true` in `gradle.properties` and `build.gradle`.
  - Scrambled Kotlin/Java symbol names and stripped debug log statements (`Log.d`, `Log.v`, `Log.i`).
- **Hermes Bytecode Compilation**:
  - Compiled JavaScript source code into pre-compiled Hermes binary bytecode (`.hbc`).
- **Screen Protection Shield (`FLAG_SECURE`)**:
  - Configured `WindowManager.LayoutParams.FLAG_SECURE` in `MainActivity.kt`.
  - Automatically blocks screenshots, screen recordings, and unauthorized screen mirroring during exam attempts and video playback.

### 9. Native Release Build & Git Deployment
- **TypeScript Check**: `npx tsc --noEmit` -> **0 errors**.
- **Gradle Release Compilation**: `gradlew assembleRelease` succeeded (`BUILD SUCCESSFUL in 5m`).
- **Physical Device Installation**: Installed on connected device (`Performing Streamed Install -> Success`).
- **Git Version Control**: Pushed commit `c0ef30a` to `origin/master`.

---

## Key Project File Map
- **Exam Engine Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/exam/%5Bid%5D.tsx)
- **Exam Results & Report Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/results/%5Bid%5D.tsx)
- **Student Profile & Digital ID Card**: [profile.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(tabs)/profile.tsx)
- **Exam State Store**: [exam-store.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/stores/exam-store.ts)
- **Firestore Services & Scoring Engine**: [firestore.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/services/firestore.ts)
- **Responsive System Hook**: [useResponsive.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/hooks/useResponsive.ts)
- **Release APK**: [Zee Prep.apk](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/Zee%20Prep.apk)
