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

### 2. Role-Based Report Viewing Architecture (ZeePrep Web Spec Alignment)
- **Student Report View (`src/app/results/[id].tsx`)**:
  - Displays the **Generic Performance Report**:
    - Pass/Needs Revision Status Badge
    - Score Obtained / Total Marks (`18 / 25`)
    - Percentage Score (`72%`)
    - Accuracy (`75%`) & Total Time Spent (`14 mins 32 secs`)
    - Performance Analytics Summary Cards (Total Questions, Total Possible Marks, Correct Answers, Incorrect Answers, Unattempted)
    - Gemini AI Diagnostic Performance Insights (Strong Topics, Weak Topics, Conceptual Gaps, Actionable Advice, Recommendation)
  - **Excludes** itemized question-by-question text & correct answer keys from students.
- **Teacher & Admin Report View (`src/app/results/[id].tsx`, `src/app/(teacher)/reports.tsx`)**:
  - Displays **Full Itemized Diagnostic Breakdown**:
    - Complete summary stats + AI Diagnostic Analysis
    - **PLUS** Itemized Question-by-Question breakdown (Question #, Question Text, Student Answer, Correct Answer, Question Weight, Awarded Marks, Time Spent per question).

### 3. Mobile Exam Window Layout Repair & Viewport Architecture
- **Root Cause Defect Fix (`src/app/exam/[id].tsx`)**:
  - Eliminated the unconstrained horizontal numbered `ScrollView` strip from the main screen layout, which previously caused flex calculations to collapse the main question view and push question text off-screen.
  - Replaced the permanent horizontal row with a compact `Question Navigator (▦)` trigger button launching a bottom-sheet modal grid.
- **Mobile-First Layout Structure**:
  - **Top Fixed Header**: Back Arrow (with exit alert), Exam Title, Defensive Timer (`⏱ 24:36`), and Palette trigger (`▦`).
  - **Subheader Meta Row**: Question Badge (`Q X of N`), Marks Tag (`+X Marks`), Clear Answer (`Trash2`), and Mark for Review (`Bookmark`).
  - **Main Content ScrollView (`flex: 1`)**: Question Text, Attached Media Images, Answer Option Cards (`[A]`, `[B]`, `[C]`, `[D]`).
  - **Fixed Bottom Action Bar**: `[ < Prev ]`, `[ ▦ Palette ]`, `[ Next > ]` / `[ Submit Exam ]`.
- **Defensive Timer Engine (`src/stores/exam-store.ts`, `src/app/exam/[id].tsx`)**:
  - Built `formatTimerDefensive` and safe duration parser (`parseExamDurationSeconds`) that handles missing/invalid `durationMinutes` or draft states.
  - Guaranteed **NEVER** to render `NaN:NaN`, `undefined`, or negative numbers under any circumstances.
- **Submit Examination Confirmation Modal**:
  - Intercepts `Submit Exam` tap with a confirmation modal displaying live counts for `Answered`, `Unanswered`, `Marked for Review`, and `Total Questions`.
- **Responsive & Orientation Support**:
  - Uses `useResponsive` hook for safe area insets (`safeTop`, `safeBottom`).
  - In Landscape mode, splits the content area into a 2-column layout (Left: Question Stem + Media, Right: Options Cards).

### 4. Dynamic Role-Based Screen Protection (SuperAdmin Exemption)
- **Native Android Module (`ScreenSecurityModule.kt`)**:
  - Built Kotlin React Native bridge module `ScreenSecurityModule` with `@ReactMethod fun allowScreenshots(allow: Boolean)`.
- **Role Control Logic (`src/utils/security-helper.ts`)**:
  - **SuperAdmins (`user.role === "superadmin"`)**: Calls `ScreenSecurityModule.allowScreenshots(true)` which clears `FLAG_SECURE`. SuperAdmins can take screenshots and record screen content.
  - **All Other Roles (Students, Teachers, Admins, Guests)**: Enforces `FLAG_SECURE` (`ScreenSecurityModule.allowScreenshots(false)`), blocking all screenshots and screen recordings across the app.

### 5. Enterprise Anti-Tampering & Security Hardening
- **ProGuard / R8 Bytecode Obfuscation**:
  - Configured `android.enableMinifyInReleaseBuilds=true` and `android.enableShrinkResourcesInReleaseBuilds=true` in `gradle.properties` and `build.gradle`.
- **Hermes Bytecode Compilation**:
  - Compiled JavaScript source code into pre-compiled Hermes binary bytecode (`.hbc`).

### 6. Native Release Build & Git Deployment
- **TypeScript Check**: `npx tsc --noEmit` -> **0 errors**.
- **Gradle Release Compilation**: `gradlew assembleRelease` succeeded (**BUILD SUCCESSFUL in 1m 50s**).
- **Physical Device Installation**: Installed on connected device (`Performing Streamed Install -> Success`).
- **Git Version Control**: Pushed commit `560781d` to `origin/master`.

---

## Key Project File Map
- **Exam Engine Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/exam/%5Bid%5D.tsx)
- **Student Reports Screen**: [reports.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(tabs)/reports.tsx)
- **Exam Scorecard & Results Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/results/%5Bid%5D.tsx)
- **Teacher Reports Screen**: [reports.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(teacher)/reports.tsx)
- **Firestore Service**: [firestore.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/services/firestore.ts)
- **Release APK**: [Zee Prep.apk](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/Zee%20Prep.apk)
