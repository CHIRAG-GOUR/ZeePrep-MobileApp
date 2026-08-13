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

### 2. Gemini 2.5 Flash Model Integration & AI Teacher Copilot (1-100 Question Generator)
- **Direct Model Endpoint**: Standardized `getModelEndpoints` in `src/services/ai.ts` to exclusively target `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`.
- **1 to 100 Question Generator**: Added custom question count selector (1–100), topic, subject, and level parameters in `src/app/(teacher)/question-bank.tsx` using `gemini-2.5-flash`.
- **Question Bank Level Isolation**: Aligned parameter signatures in `getQuestionBank` so Level 1, Level 2, and Level 3 tabs filter items correctly.
- **Normalized Option Display (A/B/C/D)**: Fixed option normalizer in `src/utils/question-normalizer.ts` to always output clean A, B, C, D labels.

### 3. Single-Source Authoritative Report Engine & Invariant Validation (`src/services/report-engine.ts`)
- **Snapshot Source of Truth**: `calculateExamReport` uses the exact 25-question array loaded for that attempt (`questionsSnapshot`) as the single source of truth. Snapshots `questionsSnapshot` into `attempt.questions` and `report.detailedAnalysis`.
- **Strict Report Invariant**: Enforces `correctCount + wrongCount + unansweredCount === totalQuestions`. Throws `ReportIntegrityError` if any count or score invariant fails.
- **Non-Negative Score & Dynamic Weighting**: `obtainedMarks = sum(awardedMarks)`, `totalPossibleMarks = sum(q.marks || 1)`, `percentage = (obtainedMarks / totalPossibleMarks) * 100`.
- **Eliminated Stale Report Fallback**: Removed dangerous fallback from `getStudentReport` in `src/services/firestore.ts` that previously returned old 31-question report documents from other exams.
- **Local In-Memory Cache (`localReportCache`)**: Immediately retains generated reports in memory upon submission for zero-latency retrieval.

### 4. Canonical Answer Evaluator & Internal Option ID Elimination (`src/utils/answer-evaluator.ts`)
- **Universal Answer Resolver (`resolveOptionText`)**: Resolves internal database option IDs (`opt_q_a`, `opt_q_b`, `opt_q_ai_...`), letters (`"A"`, `"B"`), indices (`0..3`), labels (`"Option A"`), and objects (`{id, text}`) into clean, human-readable option text (e.g., `B. Irreversible change`).
- **Eliminated Internal IDs**: Completely removes `opt_q_a`, `opt_q_b`, and `opt_q_ai_...` strings from report UI screens. If an answer cannot be resolved, displays `"Answer unavailable"`.

### 5. 100% Responsive Question Analysis Layout (`src/app/results/[id].tsx`)
- **Vertical Stack Card Architecture**: Replaced squeezed horizontal metrics rows with a responsive vertical block layout.
- **Zero Text Clipping**: Full vertical wrapping for multi-line questions, long option texts, and small/large Android screens in portrait and landscape modes.

### 6. Role-Isolated AI Analysis & Faculty/Teacher Workflow Overhaul
- **Student View Isolation**: Completely removed AI/Gemini diagnostic cards, strong/weak topic cards, and AI suggestions from student report screens. Zero AI API calls are triggered when students view their reports.
- **Faculty/Teacher Diagnostic View**: Teacher view retains full Faculty Itemization and Faculty Performance Analysis generated from factual attempt telemetry.
- **Dual Collection Querying & Teacher Filtering**: `getTeacherReports` and `getAllStudentReports` query both `reports` and `examAttempts` collections in Firestore, merge `localReportCache` items, and apply safe authorization filtering by school, grade, and section.
- **Interactive Submissions & Search**: Added instant search bar to `src/app/(teacher)/reports.tsx` and made submission cards in `src/app/(teacher)/submissions.tsx` clickable to navigate directly to `/results/${r.id}` inside the Faculty portal.

### 7. Configurable Exam Attempt Limit Engine
- **Teacher Configuration (`src/app/(teacher)/exam-builder.tsx`)**: Added Maximum Attempts Allowed pill selector (1, 2, 3, 5, 10, Unlimited). Default = `1 Attempt`.
- **Attempt Tracking & Scorecard Preservation**: Generates deterministic IDs (`attempt_${examId}_${uid}_att${attemptNum}`) to prevent overwriting past scorecards.
- **Student Exam Tracking (`src/app/(tabs)/exams.tsx`)**: Displays `Attempts Used / Max Attempts` and disables starting exams when limits are reached.

### 8. Dynamic Role-Based Screen Protection (SuperAdmin Exemption)
- **Kotlin Security Module (`ScreenSecurityModule.kt`)**: Bridge module dynamically toggling `FLAG_SECURE`.
- **Role Control**: `user.role === "superadmin"` clears `FLAG_SECURE` to allow screenshots and screen recording; all other roles enforce `FLAG_SECURE`.

### 9. Enterprise Anti-Tampering & Security Hardening
- **ProGuard / R8 Bytecode Obfuscation**: Enabled minification and resource shrinking in Gradle release builds.
- **Hermes Bytecode Compilation**: Pre-compiles JavaScript source into Hermes binary bytecode (`.hbc`).

### 10. Native Build & Git Deployment Verification
- **TypeScript Check**: `npx tsc --noEmit` -> **0 errors**.
- **Git Repository**: Pushed commits to `https://github.com/CHIRAG-GOUR/ZeePrep-MobileApp.git` (`master` branch).
- **Release APK**: Built and installed cleanly via `npx expo run:android --variant release`.

---

## Key Project File Map
- **Authoritative Report Engine**: [report-engine.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/services/report-engine.ts)
- **Canonical Answer Evaluator**: [answer-evaluator.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/utils/answer-evaluator.ts)
- **Question Normalizer**: [question-normalizer.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/utils/question-normalizer.ts)
- **Safe Number Utils**: [number-utils.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/utils/number-utils.ts)
- **Exam Engine Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/exam/%5Bid%5D.tsx)
- **Exam Scorecard & Results Screen**: [id.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/results/%5Bid%5D.tsx)
- **Teacher Question Bank (1-100 Generator)**: [question-bank.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(teacher)/question-bank.tsx)
- **Teacher Reports Screen**: [reports.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(teacher)/reports.tsx)
- **Teacher Submissions Screen**: [submissions.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(teacher)/submissions.tsx)
- **Teacher Exam Builder**: [exam-builder.tsx](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/app/(teacher)/exam-builder.tsx)
- **Firestore Service**: [firestore.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/services/firestore.ts)
- **AI Service**: [ai.ts](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/src/services/ai.ts)
- **Release APK**: [Zee Prep.apk](file:///E:/1.%20Skillizee/Zee%20Prep%20-%20Mobile%20App/Zee%20Prep.apk)
