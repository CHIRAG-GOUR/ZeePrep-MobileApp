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

### 10. Teacher & Admin Real-Time Report Visibility Engine
- **Lifecycle Focus Refetch**: Integrated `useFocusEffect` and `useCallback` across `src/app/(teacher)/reports.tsx`, `src/app/(teacher)/submissions.tsx`, `src/app/(admin)/reports.tsx`, and `src/app/(superadmin)/analytics.tsx`.
- **Zero Restart Requirement**: Newly submitted student reports populate immediately when a Teacher or Admin opens or returns to the Reports screen without needing to reinstall, log out, or restart the app.
- **Interactive Search & Scoped Routing**: Added real-time search filtering across student names, exam titles, grades, and subjects, with seamless navigation to `/results/${report.id}`.

### 11. AI Suggested Resources for Weak Topics Architecture (`src/services/weak-topic-resource-engine.ts`)
- **Deterministic Weak Topic Derivation**: Factual weakness calculation based on question-level telemetry (`deriveFactualTopicBreakdown` with threshold `accuracy < 60%`).
- **Grounded AI Matching with Gemini 2.5 Flash**: Evaluates student mistakes against actual uploaded ZeePrep resources from the `study_resources` collection. Strict negative prompt constraints prevent fabrication or hallucination of fake resource IDs or URLs.
- **Zero-Failure Submission Contract**: Robust fallback to deterministic local keyword/topic matching if Gemini API or network is unavailable, ensuring exam report generation never fails.
- **In-App Resource Viewer (`ResourceViewerModal`)**: Interactive study resource cards in the Student Report screen allow students to instantly preview PDFs, video lectures, YouTube content, and documents directly from their report.

### 12. Strict Class/Grade + Subject Resource Recommendation Isolation (`src/services/weak-topic-resource-engine.ts`)
- **Deterministic Hard Filtering (Pre-AI)**: `isResourceEligibleForStudent` strictly requires `normalizeGrade(resource.grade) === normalizeGrade(student.grade)` AND `normalizeSubject(resource.subject) === normalizeSubject(student.subject)`. Cross-class (e.g. Class 7 to Class 8) and cross-subject (e.g. Mathematics to Science) recommendations are 100% blocked before the AI candidate pool is formed.
- **Defense-in-Depth Validation (Post-AI)**: Every recommended resource returned by Gemini 2.5 Flash undergoes re-validation against the student's authorized class, subject, and schoolId. Any non-matching recommendation is immediately discarded.
- **Uncovered Topic Guidance**: If a topic is not given or sufficiently explained in uploaded materials, renders the clear notice: *"Ask teacher to upload the resource or provide it."*

### 13. Permanent Multi-Layer Report Persistence & Recovery Architecture (`src/services/firestore.ts`)
- **Offline & Cross-Day Persistent Disk Layer**: Replaced fragile in-memory-only caching with persistent device storage powered by `expo-secure-store` / `localStorage` (`persistReportToDisk` and `loadPersistentReportsFromDisk`). Every submitted exam and fetched report is indexed and saved to disk.
- **10-Tier Multi-Layer Recovery Hierarchy**: `getStudentReport` checks in-memory RAM -> persistent device disk -> direct Firestore `reports` -> direct Firestore `examAttempts` -> ID prefix translations -> single-field queries (bypassing Firestore composite index limitations) -> full disk catalog hydration.
- **Permanent Visibility Across Restarts & Days**: Reports survive app closure, process termination, phone reboots, login/logout cycles, and network dropouts without ever disappearing.
- **Dual Presentation Switcher for Leadership**: Added an interactive view toggle in `src/app/results/[id].tsx` (`Student Scorecard View` vs `Faculty Detailed View`) for SuperAdmin and Admin, allowing instant inspection of either presentation powered by the same single underlying report document.
- **Real-Time Student Focus Sync (`useFocusEffect`)**: Student Reports tab now automatically refreshes historical exam reports upon screen focus with responsive retry handling.

### 14. Native Build & Git Deployment Verification
- **TypeScript Check**: `npx tsc --noEmit` -> **0 errors**.
- **Git Repository**: Pushed commits to `https://github.com/CHIRAG-GOUR/ZeePrep-MobileApp.git` (`master` branch).
