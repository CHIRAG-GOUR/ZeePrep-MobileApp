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

### 2. COMPLETE EXAM REPORT ENGINE REPAIR & VERIFIED ANALYTICS
- **Safe Number Normalization Layer (`src/utils/number-utils.ts`)**:
  - Implemented `safeNumber`, `safeInteger`, `safePercentage`, and `safeDuration` utility functions.
  - Eliminated `NaN`, `undefined`, `null`, and `Infinity` across exam calculations, reporting pipelines, and UI views.
- **Root Cause Defect Fix in `mapDocumentToReport` (`src/services/firestore.ts`)**:
  - Fixed `totalQuestions` property mapping defect where `(d.answers ? d.answers.length : 0)` executed on an object (`d.answers` is a key-value map), causing `d.answers.length` to evaluate to `undefined` and producing `NaN Total Questions`.
  - Added safe fallbacks: `d.totalQuestions || d.detailedAnalysis?.length || d.questions?.length || Object.keys(d.answers || {}).length`.
  - Restored mapping of `detailedAnalysis` array in `mapDocumentToReport`, eliminating the *"Question-level analysis data not available for this legacy attempt"* bug.
- **Zero Negative Marking & Dynamic Question Weighting (`src/services/firestore.ts`)**:
  - Enforced zero negative marking: `Correct = +q.marks`, `Incorrect = 0`, `Unanswered = 0`. Score is strictly non-negative (`Math.max(0, obtainedMarks)`).
  - Dynamically calculates total possible marks as `sum(q.marks || 1)` for the specific attempt questions.
- **Question Time Tracking & Most Time Spent Analytics (`src/services/firestore.ts`, `src/app/exam/[id].tsx`)**:
  - Accumulates per-question time spent across revisits.
  - Deterministically identifies `mostTimeSpentQuestion` and `mostTimeSpentTopic` on the backend without AI hallucination.
- **Clean & Simple Student Report View (`src/app/results/[id].tsx`)**:
  - **Removed Gemini AI cards & hardcoded fallback educational advice** ("Basic Concepts", "Multi-step Calculations") from the Student view.
  - Renders **Clean Student Scorecard**: Hero Score Badge (`Obtained / Total Marks`, `Percentage`), Performance Analytics Grid (`Correct`, `Wrong`, `Unanswered`, `Time Spent`), Itemized Question Analysis list (`Question 1 ✓ Correct 12s`), and Most Time Spent Card (`Question #`, `Topic`, `Time`).
- **Detailed Teacher & Admin Report View (`src/app/results/[id].tsx`, `src/services/ai.ts`)**:
  - Renders complete teacher diagnostic itemization (Question Text, Options, Student Answer, Correct Answer, Weight, Awarded Marks).
  - Renders real Gemini AI Diagnostic Insights **ONLY** when generated from valid factual data. Stripped hardcoded fake advice from `src/services/ai.ts`.

### 3. TASK 31: Configurable Exam Attempt Limit Engine
- **Teacher Configuration (`src/app/(teacher)/exam-builder.tsx`)**:
  - Added Maximum Attempts Allowed pill selector with options: `1 Attempt (Default)`, `2 Attempts`, `3 Attempts`, `5 Attempts`, `10 Attempts`, `Unlimited`.
  - Default = `1 Attempt` (`maxAttempts = 1`). Persisted with the exam document in Firestore (`maxAttempts`).
- **Data/Backend Level Attempt Enforcement (`src/services/firestore.ts`)**:
  - Built `getStudentExamAttempts(examId, studentUid)` querying all submitted attempts for a student from Firestore.
  - Implemented deterministic attempt IDs (`attempt_${exam.id}_${user.uid}_att${attemptNum}`) and report IDs (`report_${exam.id}_${user.uid}_att${attemptNum}`) to guarantee previous attempt scorecards are **NEVER** overwritten.
- **Student Exam Attempt Tracking (`src/app/(tabs)/exams.tsx`)**:
  - Displays transparent attempt metadata on each exam card: `Max Attempts`, `Attempts Used`, `Attempts Remaining`.
  - Disables "Start Exam" and displays **`Attempt Limit Reached`** notice when attempts are exhausted.

### 4. Universal Question Text Normalization & ZeePrep Purple Palette Accent
- **Question Text Fallback Engine (`src/app/exam/[id].tsx`)**:
  - Implemented `getQuestionText(q)` helper function resolving question text across all schema variants: `q.text || q.questionText || q.question || q.statement || q.title`.
- **ZeePrep Purple Palette Styling**:
  - Styled current/selected question nodes with a vibrant **ZeePrep Purple filled background (`#4F46E5`)**, indigo border (`#3730A3`), white bold text, and elevation shadow.

### 5. Dynamic Role-Based Screen Protection (SuperAdmin Exemption)
- **Native Android Module (`ScreenSecurityModule.kt`)**:
  - Built Kotlin React Native bridge module `ScreenSecurityModule` with `@ReactMethod fun allowScreenshots(allow: Boolean)`.
- **Role Control Logic (`src/utils/security-helper.ts`)**:
  - **SuperAdmins (`user.role === "superadmin"`)**: Calls `ScreenSecurityModule.allowScreenshots(true)` which clears `FLAG_SECURE`. SuperAdmins can take screenshots and record screen content.
  - **All Other Roles (Students, Teachers, Admins, Guests)**: Enforces `FLAG_SECURE`, blocking all screenshots and screen recordings.

### 6. Enterprise Anti-Tampering & Security Hardening
- **ProGuard / R8 Bytecode Obfuscation**:
  - Configured `android.enableMinifyInReleaseBuilds=true` and `android.enableShrinkResourcesInReleaseBuilds=true` in `gradle.properties` and `build.gradle`.
- **Hermes Bytecode Compilation**:
  - Compiled JavaScript source code into pre-compiled Hermes binary bytecode (`.hbc`).

### 7. Native Release Build & Git Deployment
- **TypeScript Check**: `npx tsc --noEmit` -> **0 errors**.
- **Gradle Release Compilation**: `gradlew assembleRelease` succeeded (**BUILD SUCCESSFUL in 1m 50s**).
- **Git Version Control**: Pushed commit `e0e098c` to `origin/master`.

---

## Key Project File Map
- **Safe Number Utils**: [number-utils.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/utils/number-utils.ts)
- **Exam Engine Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/exam/%5Bid%5D.tsx)
- **Student Exams Screen**: [exams.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(tabs)/exams.tsx)
- **Student Reports Screen**: [reports.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(tabs)/reports.tsx)
- **Exam Scorecard & Results Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/results/%5Bid%5D.tsx)
- **Teacher Exam Builder**: [exam-builder.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(teacher)/exam-builder.tsx)
- **Firestore Service**: [firestore.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/services/firestore.ts)
- **AI Service**: [ai.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/services/ai.ts)
- **Release APK**: [Zee Prep.apk](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/Zee%20Prep.apk)
