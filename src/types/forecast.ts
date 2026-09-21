/**
 * ZeePrep — Board Examination Preparation Forecast & Progression Types
 * ---------------------------------------------------------------------
 * Additive, backward-compatible layer that sits ON TOP of the authoritative
 * deterministic report engine (report-engine.ts). Nothing here alters factual
 * assessment scores; these types describe the forecast, level progression,
 * exam-to-exam progression, and problem-type diagnostic analytics.
 */

export type ForecastConfidence = "insufficient" | "low" | "medium" | "high";

export type ForecastTrend =
  | "strong_growth"
  | "growth"
  | "stable"
  | "declining"
  | "strong_decline"
  | "inconsistent";

/** A single valid assessment contributing to a subject forecast (chronological). */
export interface AssessmentDataPoint {
  reportId: string;
  examId: string;
  examTitle: string;
  /** Deterministic actual score percentage from report-engine (0-100). */
  percentage: number;
  score?: number;
  totalMarks?: number;
  /** Effective difficulty of the exam on a 1..3 scale (level1..level3). */
  weightedDifficulty: number;
  level?: 1 | 2 | 3;
  totalQuestions: number;
  timeSpentSeconds?: number;
  /** ISO timestamp of the attempt. */
  date: string;
  topics: string[];
  attemptNumber: number;
}

export interface LevelScorePrediction {
  level1PredictedScore: number; // 0-100 (Level 1 Foundational prediction)
  level2PredictedScore: number; // 0-100 (Level 2 Application prediction)
  level3PredictedScore: number; // 0-100 (Level 3 Advanced / HOTS prediction)
  overallAveragePredictedScore: number; // 0-100 (Average across all 3 levels)
  level1Accuracy: number; // Actual % on Level 1
  level2Accuracy: number; // Actual % on Level 2
  level3Accuracy: number; // Actual % on Level 3
  level1Attempts: number;
  level2Attempts: number;
  level3Attempts: number;
}

export interface AdaptiveReadinessGate {
  isReadyForNextLevel: boolean;
  currentLevel: 1 | 2 | 3;
  nextRecommendedLevel: 1 | 2 | 3;
  readinessScore: number; // 0-100
  thresholdRequired: number; // e.g. 75%
  rationale: string;
  criteriaPassed: string[];
  criteriaPending: string[];
}

export interface ExamProgressionMilestone {
  reportId: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  level: 1 | 2 | 3;
  date: string;
  accuracyDeltaFromPrevious?: number;
  scoreDeltaFromPrevious?: number;
  timeDeltaFromPrevious?: number;
  status: "improved" | "declined" | "steady" | "initial";
}

export interface ExamProgressionSummary {
  milestones: ExamProgressionMilestone[];
  initialScore: number;
  latestScore: number;
  overallGrowth: number;
  growthRate: number; // points per assessment
  consistencyRating: "Excellent" | "Good" | "Needs Effort" | "Initial";
  weakTopicsResolvedCount: number;
  weakTopicsResolved: string[];
  newWeakTopics: string[];
  summarySentence: string;
}

export interface AcademicProblemDiagnosis {
  questionId: string;
  questionNumber: number;
  subject: string;
  chapter: string;
  topic: string;
  problemType: string;
  formulaStruggledWith: string;
  conceptStruggledWith: string;
  studentMistakeAnalysis: string;
  exactRemedy: string;
  severity: "high" | "medium" | "low";
}

/** Deterministic, AI-free normalized profile for one subject. */
export interface SubjectAssessmentProfile {
  subjectKey: string;        // normalized (e.g. "mathematics")
  subjectDisplay: string;    // human display (e.g. "Mathematics")
  grade: string;
  board?: string;
  assessmentCount: number;
  dataPoints: AssessmentDataPoint[]; // chronological, deduped per exam (latest valid attempt)
  distinctTopics: string[];
  levelCoverage: { level1: number; level2: number; level3: number };
  levelPredictions?: LevelScorePrediction;
  readinessGate?: AdaptiveReadinessGate;
  progressionSummary?: ExamProgressionSummary;
  /** 0-100 breadth heuristic (topics assessed + level spread + volume). NOT a true syllabus %. */
  coverageSignal: number;
  recencyWeightedScore: number;   // 0-100
  volatility: number;             // std-dev style spread of recent scores
  improvementRate: number;        // slope, percentage-points per assessment
  deterministicPrediction: number;// 0-100 baseline board-equivalent estimate
  deterministicRange: { min: number; max: number };
  trendDirection: ForecastTrend;
  strongTopics: string[];
  weakTopics: string[];
  hasEnoughData: boolean;
}

/** Compact forecast snapshot (what Gemini produces or deterministic engine generates). */
export interface BoardForecastSnapshot {
  studentId: string;
  subjectKey: string;
  subjectDisplay: string;
  grade?: string;
  predictedPercentage: number;
  minPrediction: number;
  maxPrediction: number;
  confidence: ForecastConfidence;
  trend: ForecastTrend;
  summaryPointers: string[];
  strengths: string[];
  improvementAreas: string[];
  nextActions: string[];
  confidenceReasons: string[];
  warningFlags?: string[];
  levelPredictions?: LevelScorePrediction;
  readinessGate?: AdaptiveReadinessGate;
  progressionSummary?: ExamProgressionSummary;
  assessmentCount: number;
  coverageSignal: number;
  latestExamId: string;
  generatedAt: string;       // ISO
  modelVersion: string;      // e.g. "forecast-v2/gemini-2.5-flash"
  source: "ai" | "deterministic";
}

/** One compact point in the persisted prediction history (how the forecast itself moved). */
export interface ForecastHistoryPoint {
  date: string;              // ISO
  predictedPercentage: number;
  actualPercentage: number;  // the assessment score that produced this update
  confidence: ForecastConfidence;
  examId: string;
  assessmentCount: number;
}

/** Persisted per (student, subject) forecast document. */
export interface SubjectForecastRecord {
  id: string;                // `${studentId}__${subjectKey}`
  studentId: string;
  subjectKey: string;
  subjectDisplay: string;
  grade?: string;
  latest: BoardForecastSnapshot;
  history: ForecastHistoryPoint[];
  updatedAt: string;
}

/** Raw shape we ask Gemini to return (validated before use). */
export interface BoardPredictionResult {
  predictedPercentage: number;
  likelyRange: { min: number; max: number };
  confidence: "low" | "medium" | "high";
  trend: ForecastTrend;
  summaryPointers: string[];
  strengths: string[];
  improvementAreas: string[];
  nextActions: string[];
  confidenceReasons: string[];
  warningFlags?: string[];
}
