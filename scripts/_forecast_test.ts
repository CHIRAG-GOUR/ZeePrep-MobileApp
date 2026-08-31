/* Standalone deterministic-math test for the board forecast engine. */
import type { Report, DetailedQuestionAnalysis } from "../src/types";
import {
  buildSubjectAssessmentProfile,
  deriveConfidence,
  subjectKeyForReport,
} from "../src/services/board-forecast-engine";

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log("  ok  - " + msg); }
  else { fail++; console.log("  FAIL- " + msg); }
}

let idc = 0;
function makeReport(subject: string, pct: number, level: "level1"|"level2"|"level3", opts?: { examId?: string; grade?: string; date?: string; attempt?: number; topic?: string }): Report {
  idc++;
  const examId = opts?.examId || `exam_${subject}_${idc}`;
  const nQ = 10;
  const correct = Math.round((pct / 100) * nQ);
  const da: DetailedQuestionAnalysis[] = Array.from({ length: nQ }, (_, i) => ({
    questionId: `q${i}`,
    questionNumber: i + 1,
    questionText: `Q${i}`,
    correctAnswer: "A",
    studentAnswer: i < correct ? "A" : "B",
    isCorrect: i < correct,
    isUnanswered: false,
    marks: 1,
    awardedMarks: i < correct ? 1 : 0,
    timeSpentSeconds: 10,
    chapter: opts?.topic || "Ch",
    topic: opts?.topic || "TopicA",
    level,
  }));
  return {
    id: `${examId}_att${opts?.attempt || 1}`,
    examId,
    examTitle: `${subject} Test`,
    studentId: "stu1",
    studentName: "S",
    studentEmail: "s@x.com",
    attemptNumber: opts?.attempt || 1,
    subject,
    grade: opts?.grade || "10",
    totalMarks: nQ,
    obtainedMarks: correct,
    percentage: pct,
    passed: pct >= 33,
    totalQuestions: nQ,
    correctAnswers: correct,
    incorrectAnswers: nQ - correct,
    unattempted: 0,
    timeSpentSeconds: 100,
    accuracy: pct,
    detailedAnalysis: da,
    createdAt: opts?.date || new Date(2026, 0, idc).toISOString(),
  } as Report;
}

function profileFor(reports: Report[], subject = "Mathematics", grade = "10") {
  return buildSubjectAssessmentProfile(reports, {
    subjectKey: subjectKeyForReport({ subject } as Report),
    subjectDisplay: subject,
    grade,
  });
}

console.log("TEST 1: improving student not stuck at old average");
{
  const r = [50,54,58,74,79,82].map((p,i)=>makeReport("Mathematics",p,"level2",{date:new Date(2026,0,i+1).toISOString()}));
  const prof = profileFor(r);
  console.log(`   pred=${prof.deterministicPrediction} range=${prof.deterministicRange.min}-${prof.deterministicRange.max} trend=${prof.trendDirection} avgOld=${Math.round((50+54+58)/3)}`);
  assert(prof.deterministicPrediction >= 72, "prediction pulled toward recent (>=72), not old avg");
  assert(prof.trendDirection === "growth" || prof.trendDirection === "strong_growth", "trend is growth");
}

console.log("TEST 2: declining student trend must not lie");
{
  const r = [82,79,74,69].map((p,i)=>makeReport("Mathematics",p,"level2",{date:new Date(2026,0,i+1).toISOString()}));
  const prof = profileFor(r);
  console.log(`   pred=${prof.deterministicPrediction} trend=${prof.trendDirection}`);
  assert(prof.trendDirection === "declining" || prof.trendDirection === "strong_decline", "trend declining");
}

console.log("TEST 3: difficulty discount — 95% on Level 1 is not 95% board");
{
  const easy = [95,95,95,95].map((p,i)=>makeReport("Mathematics",p,"level1",{date:new Date(2026,0,i+1).toISOString()}));
  const hard = [75,75,75,75].map((p,i)=>makeReport("Physics",p,"level3",{date:new Date(2026,0,i+1).toISOString()}));
  const pe = profileFor(easy);
  const ph = profileFor(hard, "Physics");
  console.log(`   easyL1 pred=${pe.deterministicPrediction}  hardL3 pred=${ph.deterministicPrediction}`);
  assert(pe.deterministicPrediction < 95, "95% easy discounted below 95");
  assert(ph.deterministicPrediction >= 75, "75% hard not penalised below raw");
}

console.log("TEST 4: outlier damping");
{
  const r = [65,68,70,69,98].map((p,i)=>makeReport("Mathematics",p,"level2",{date:new Date(2026,0,i+1).toISOString()}));
  const prof = profileFor(r);
  console.log(`   pred=${prof.deterministicPrediction} (raw recent avg would spike toward 98)`);
  assert(prof.deterministicPrediction <= 82, "single 98 does not spike forecast above 82");
}

console.log("TEST 5: min-data gating");
{
  assert(deriveConfidence(profileFor([])) === "insufficient", "0 assessments -> insufficient");
  assert(deriveConfidence(profileFor([makeReport("Mathematics",70,"level1")])) === "low", "1 assessment -> low");
}

console.log("TEST 6: high confidence needs breadth + level spread + volume + low volatility");
{
  const r = [
    makeReport("Mathematics",70,"level1",{topic:"Algebra",date:new Date(2026,0,1).toISOString()}),
    makeReport("Mathematics",72,"level2",{topic:"Geometry",date:new Date(2026,0,2).toISOString()}),
    makeReport("Mathematics",74,"level3",{topic:"Probability",date:new Date(2026,0,3).toISOString()}),
    makeReport("Mathematics",73,"level2",{topic:"Trigonometry",date:new Date(2026,0,4).toISOString()}),
    makeReport("Mathematics",75,"level3",{topic:"Calculus",date:new Date(2026,0,5).toISOString()}),
  ];
  const prof = profileFor(r);
  console.log(`   cov=${prof.coverageSignal} vol=${prof.volatility} conf=${deriveConfidence(prof)}`);
  assert(deriveConfidence(prof) === "high", "broad, multi-level, stable -> high");
}

console.log("TEST 7: subject isolation + retake dedup");
{
  const mixed = [
    makeReport("Mathematics",80,"level2",{examId:"m1",date:new Date(2026,0,1).toISOString()}),
    makeReport("English",40,"level2",{examId:"e1",date:new Date(2026,0,2).toISOString()}),
    makeReport("Mathematics",50,"level2",{examId:"m1",attempt:2,date:new Date(2026,0,3).toISOString()}), // retake of m1
  ];
  const prof = profileFor(mixed);
  console.log(`   count=${prof.assessmentCount} (expect 1: english excluded, m1 retake collapsed) pred=${prof.deterministicPrediction}`);
  assert(prof.assessmentCount === 1, "english excluded and retake of m1 collapsed to latest");
  assert(prof.dataPoints[0].percentage === 50, "latest attempt (50) kept over first (80)");
}

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
