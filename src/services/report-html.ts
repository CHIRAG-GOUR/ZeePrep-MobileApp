/**
 * ZeePrep — Professional A4 Report HTML generator (shared web + native).
 * Produces ONE self-contained HTML document used for PDF export on both:
 *   - Web: printed via a hidden iframe window.print()
 *   - Android/iOS APK: printed via react-native-webview window.print()
 * The print CSS enforces A4 pages and page-break-inside:avoid on every block,
 * so sections/cards/tables/charts never get cut at random places.
 *
 * The preparation-trend chart is embedded as inline SVG (no chart library),
 * so it renders identically in the print output without clipping.
 */
import type { Report } from "../types";
import type { BoardForecastSnapshot, SubjectAssessmentProfile, SubjectForecastRecord } from "../types/forecast";
import type { ReportPointers } from "./report-pointers-engine";

function esc(s: any): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

const CONF_LABEL: Record<string, string> = {
  insufficient: "Insufficient data",
  low: "Low",
  medium: "Medium",
  high: "High",
};
const TREND_LABEL: Record<string, string> = {
  strong_growth: "Improving strongly",
  growth: "Improving",
  stable: "Steady",
  declining: "Declining",
  strong_decline: "Declining sharply",
  inconsistent: "Inconsistent",
};

/** Build a static inline SVG for the preparation-trend chart. */
export function buildTrendSvg(
  actual: { date: string; value: number }[],
  predicted: { date: string; value: number }[],
  range?: { min: number; max: number }
): string {
  const W = 760;
  const H = 300;
  const pad = { l: 44, r: 20, t: 20, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const n = Math.max(actual.length, predicted.length, 1);
  const sx = (i: number) => pad.l + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const sy = (v: number) => pad.t + (1 - clamp(v, 0, 100) / 100) * plotH;

  const aPts = actual.map((p, i) => ({ x: sx(i), y: sy(p.value), v: p.value, d: p.date }));
  const pPts = predicted.map((p, i) => ({ x: sx(i), y: sy(p.value), v: p.value }));

  const grid = [0, 25, 50, 75, 100]
    .map((g) => {
      const y = sy(g);
      return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="#E2E8F0" stroke-width="1"/>` +
        `<text x="${pad.l - 8}" y="${y + 3}" font-size="11" fill="#94A3B8" text-anchor="end">${g}</text>`;
    })
    .join("");

  const band =
    range && pPts.length
      ? (() => {
          const lastX = pPts[pPts.length - 1].x;
          const firstX = pPts.length > 1 ? pPts[Math.max(0, pPts.length - 3)].x : pad.l;
          return `<polygon points="${firstX},${sy(range.max)} ${lastX},${sy(range.max)} ${lastX},${sy(range.min)} ${firstX},${sy(range.min)}" fill="rgba(245,158,11,0.14)"/>`;
        })()
      : "";

  const aPath = aPts.length ? "M " + aPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") : "";
  const pPath = pPts.length ? "M " + pPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") : "";

  const aLine = aPts.length > 1 ? `<path d="${aPath}" fill="none" stroke="#4F46E5" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` : "";
  const pLine = pPts.length > 1 ? `<path d="${pPath}" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="6 5" stroke-linecap="round"/>` : "";

  const pDots = pPts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#FFFFFF" stroke="#F59E0B" stroke-width="2"/>`).join("");
  const aDots = aPts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#4F46E5" stroke="#FFFFFF" stroke-width="2"/>`).join("");

  const xlabels = aPts
    .map((p, i) => {
      if (n > 6 && i % Math.ceil(n / 6) !== 0 && i !== n - 1) return "";
      const d = new Date(p.d);
      const lbl = isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return `<text x="${p.x}" y="${H - pad.b + 20}" font-size="11" fill="#94A3B8" text-anchor="middle">${esc(lbl)}</text>`;
    })
    .join("");

  return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:${W}px">
    ${grid}${band}${pLine}${aLine}${pDots}${aDots}${xlabels}
  </svg>`;
}

function pointerList(items: string[] | undefined, color: string): string {
  if (!items || items.length === 0) return "";
  return `<ul class="pointers">${items.map((t) => `<li style="--dot:${color}">${esc(t)}</li>`).join("")}</ul>`;
}

export interface ReportHtmlInput {
  report: Report;
  forecast?: BoardForecastSnapshot | null;
  profile?: SubjectAssessmentProfile | null;
  record?: SubjectForecastRecord | null;
  pointers?: ReportPointers | null;
  variant?: "student" | "teacher";
}

export function buildReportHtml(input: ReportHtmlInput): string {
  const { report, forecast, profile, record, pointers, variant = "student" } = input;
  const generated = new Date().toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const subject = report.subject || "Assessment";
  const grade = report.grade ? (String(report.grade).toLowerCase().includes("class") || String(report.grade).toLowerCase().includes("grade") ? report.grade : `Class ${report.grade}`) : "";

  const da = report.detailedAnalysis || [];
  const questionRows = da
    .map((q, i) => {
      const status = q.isCorrect ? "Correct" : q.isUnanswered ? "Unanswered" : "Incorrect";
      const cls = q.isCorrect ? "ok" : q.isUnanswered ? "skip" : "bad";
      return `<tr>
        <td>${i + 1}</td>
        <td class="qtext">${esc(String(q.questionText || "").slice(0, 160))}</td>
        <td>${esc(q.topic || "-")}</td>
        <td>${esc(String(q.level || "").replace("level", "L"))}</td>
        <td class="${cls}">${status}</td>
        <td>${q.awardedMarks ?? 0}/${q.marks ?? 1}</td>
      </tr>`;
    })
    .join("");

  // Forecast block
  let forecastBlock = "";
  if (forecast && forecast.confidence !== "insufficient" && (profile?.assessmentCount ?? 0) > 0) {
    const actualSeries = (profile?.dataPoints || []).map((d) => ({ date: d.date, value: d.percentage }));
    const predictedSeries = (record?.history || []).map((h) => ({ date: h.date, value: h.predictedPercentage }));
    const svg = buildTrendSvg(actualSeries, predictedSeries, { min: forecast.minPrediction, max: forecast.maxPrediction });
    const teacherDiag =
      variant === "teacher" && profile
        ? `<div class="diag">
            <span><b>${profile.assessmentCount}</b> valid assessments</span>
            <span><b>${profile.distinctTopics.length}</b> topics assessed</span>
            <span>Breadth <b>${profile.coverageSignal}/100</b></span>
            <span>Volatility <b>${profile.volatility} pts</b></span>
            <span>Levels <b>L1 ${profile.levelCoverage.level1} · L2 ${profile.levelCoverage.level2} · L3 ${profile.levelCoverage.level3}</b></span>
          </div>`
        : "";
    forecastBlock = `
    <div class="section">
      <h2>${esc(forecast.subjectDisplay)} — Board Preparation Forecast</h2>
      <div class="fc-hero">
        <div class="fc-primary"><div class="fc-label">Predicted Board Score</div><div class="fc-value">${forecast.predictedPercentage}%</div></div>
        <div class="fc-stat"><div class="fc-label">Likely Range</div><div class="fc-sv">${forecast.minPrediction}% – ${forecast.maxPrediction}%</div></div>
        <div class="fc-stat"><div class="fc-label">Confidence</div><div class="fc-sv">${CONF_LABEL[forecast.confidence] || forecast.confidence}</div></div>
        <div class="fc-stat"><div class="fc-label">Trend</div><div class="fc-sv">${TREND_LABEL[forecast.trend] || forecast.trend}</div></div>
      </div>
      <div class="chart">${svg}</div>
      <div class="legend"><span class="lg lg-a">Assessment score</span><span class="lg lg-p">Predicted board</span><span class="lg lg-b">Likely range</span></div>
      ${forecast.summaryPointers?.length ? `<div class="subsec"><h3>Summary</h3>${pointerList(forecast.summaryPointers, "#4F46E5")}</div>` : ""}
      <div class="cols">
        ${forecast.strengths?.length ? `<div class="subsec"><h3 class="c-green">Strong Areas</h3>${pointerList(forecast.strengths, "#10B981")}</div>` : ""}
        ${forecast.improvementAreas?.length ? `<div class="subsec"><h3 class="c-amber">Needs Attention</h3>${pointerList(forecast.improvementAreas, "#F59E0B")}</div>` : ""}
        ${forecast.nextActions?.length ? `<div class="subsec"><h3 class="c-indigo">Next Steps</h3>${pointerList(forecast.nextActions, "#4F46E5")}</div>` : ""}
      </div>
      ${forecast.confidenceReasons?.length ? `<div class="subsec"><h3>Why confidence is ${CONF_LABEL[forecast.confidence]}</h3>${pointerList(forecast.confidenceReasons, "#64748B")}</div>` : ""}
      ${teacherDiag}
      <p class="note">This is an estimate based on ZeePrep assessments. It is not a guaranteed board result.</p>
    </div>`;
  }

  const weakList = (report.weakTopics || []).slice(0, 8);
  const topicBlock = weakList.length
    ? `<div class="section"><h2>Topic Focus Areas</h2>${pointerList(weakList.map((t) => String(t)), "#F59E0B")}</div>`
    : "";

  const remarks = report.teacherRemarks || report.teacherReview?.overallRemark || "";
  const remarksBlock = remarks
    ? `<div class="section"><h2>Teacher Remarks</h2><p>${esc(remarks)}</p></div>`
    : "";

  // AI Review (evidence-based one-line pointers)
  const cat = (title: string, color: string, items?: string[]) =>
    items && items.length ? `<div class="subsec"><h3 style="color:${color}">${title}</h3>${pointerList(items, color)}</div>` : "";
  const hasPointers =
    pointers && (pointers.doingWell.length || pointers.focusMore.length || pointers.watchOut.length || pointers.nextSteps.length);
  const pointersBlock = hasPointers
    ? `<div class="section"><h2>AI Review</h2><div class="cols">
        ${cat("Doing Well", "#059669", pointers!.doingWell)}
        ${cat("Focus More", "#B45309", pointers!.focusMore)}
        ${cat("Watch Out", "#BE123C", pointers!.watchOut)}
        ${cat("Next Step", "#4338CA", pointers!.nextSteps)}
      </div></div>`
    : "";

  // Time analysis
  const totalMin = Math.round((Number(report.timeSpentSeconds) || 0) / 60);
  const avgSec = report.totalQuestions ? Math.round((Number(report.timeSpentSeconds) || 0) / report.totalQuestions) : 0;
  const timeBlock = `<div class="section"><h2>Time Analysis</h2><div class="scorebar">
      <div class="scorebox"><div class="v">${totalMin}m</div><div class="l">Total Time</div></div>
      <div class="scorebox"><div class="v">${avgSec}s</div><div class="l">Avg / Question</div></div>
      ${report.mostTimeSpentTopic ? `<div class="scorebox"><div class="v" style="font-size:13px">${esc(report.mostTimeSpentTopic)}</div><div class="l">Most Time On</div></div>` : ""}
    </div></div>`;

  // Recommended resources (real, resolved at submit time)
  const resItems: string[] = [];
  ((report.weakTopicInsights as any[]) || []).forEach((wi) => {
    (wi?.recommendedResources || []).forEach((r: any) => {
      if (r && r.title) resItems.push(`${r.title}${r.type ? " (" + String(r.type).toUpperCase() + ")" : ""}`);
    });
  });
  const uniqueRes = Array.from(new Set(resItems)).slice(0, 8);
  const resourcesBlock = uniqueRes.length
    ? `<div class="section"><h2>Recommended Resources</h2>${pointerList(uniqueRes, "#4F46E5")}</div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ZeePrep Report — ${esc(report.studentName || "Student")}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    color: #0F172A; font-size: 12px; line-height: 1.5; background: #FFFFFF;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .brandbar { display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 3px solid #4F46E5; padding-bottom: 8px; margin-bottom: 12px; }
  .brand { font-size: 20px; font-weight: 800; color: #4F46E5; letter-spacing: 0.3px; }
  .brand small { color:#94A3B8; font-weight:600; font-size:11px; }
  .gendate { font-size: 10px; color: #94A3B8; text-align:right; }
  .idcard { display:flex; flex-wrap:wrap; gap: 6px 22px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 14px; margin-bottom:12px; }
  .idcard div { font-size: 11px; color:#475569; }
  .idcard b { color:#0F172A; }
  .scorebar { display:flex; gap:10px; margin-bottom:12px; }
  .scorebox { flex:1; border:1px solid #E2E8F0; border-radius:10px; padding:10px; text-align:center; }
  .scorebox .v { font-size: 20px; font-weight: 800; }
  .scorebox .l { font-size: 10px; color:#64748B; text-transform:uppercase; letter-spacing:0.4px; }
  .ok { color:#059669; } .bad { color:#DC2626; } .skip { color:#64748B; }
  .section { border:1px solid #E2E8F0; border-radius:12px; padding:12px 14px; margin-bottom:12px; break-inside: avoid; page-break-inside: avoid; }
  .section h2 { font-size: 15px; margin: 0 0 8px; color:#0F172A; }
  .subsec { margin-top: 8px; break-inside: avoid; page-break-inside: avoid; }
  .subsec h3 { font-size: 12px; margin: 0 0 4px; text-transform:uppercase; letter-spacing:0.4px; }
  .c-green{color:#059669}.c-amber{color:#B45309}.c-indigo{color:#4338CA}
  .cols { display:flex; flex-wrap:wrap; gap: 10px 24px; }
  .cols .subsec { flex:1; min-width: 200px; }
  ul.pointers { list-style:none; margin:4px 0; padding:0; }
  ul.pointers li { position:relative; padding-left:14px; margin:3px 0; break-inside:avoid; page-break-inside:avoid; }
  ul.pointers li:before { content:""; position:absolute; left:2px; top:6px; width:6px; height:6px; border-radius:50%; background: var(--dot,#4F46E5); }
  .fc-hero { display:flex; flex-wrap:wrap; gap: 14px 26px; align-items:flex-end; margin-bottom:10px; }
  .fc-primary .fc-value { font-size: 40px; font-weight: 900; color:#4F46E5; line-height:1; }
  .fc-label { font-size: 10px; color:#64748B; text-transform:uppercase; letter-spacing:0.5px; }
  .fc-sv { font-size: 15px; font-weight: 800; }
  .chart { break-inside: avoid; page-break-inside: avoid; margin: 6px 0; }
  .legend { display:flex; gap:16px; justify-content:center; font-size:10px; color:#475569; margin-top:4px; }
  .lg:before{content:"";display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:middle;}
  .lg-a:before{background:#4F46E5;} .lg-p:before{background:#fff;border:2px solid #F59E0B;} .lg-b:before{background:rgba(245,158,11,0.4);border-radius:2px;}
  .diag { display:flex; flex-wrap:wrap; gap:6px 18px; background:#0F172A; color:#E2E8F0; border-radius:8px; padding:8px 12px; margin-top:8px; font-size:11px; }
  .diag b { color:#fff; }
  table { width:100%; border-collapse: collapse; font-size: 11px; }
  thead { display: table-header-group; }
  th { background:#F1F5F9; text-align:left; padding:6px; border-bottom:2px solid #E2E8F0; font-size:10px; text-transform:uppercase; letter-spacing:0.3px; }
  td { padding:6px; border-bottom:1px solid #F1F5F9; vertical-align:top; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  td.qtext { max-width: 300px; }
  .note { font-size: 10px; color:#94A3B8; margin-top:6px; }
</style>
</head>
<body>
  <div class="brandbar">
    <div class="brand">ZeePrep <small>Academic Report</small></div>
    <div class="gendate">Generated ${esc(generated)}</div>
  </div>

  <div class="idcard">
    <div><b>${esc(report.studentName || "Student")}</b></div>
    <div>${esc(report.studentEmail || "")}</div>
    <div>Subject: <b>${esc(subject)}</b></div>
    <div>${esc(grade)}${report.section ? " · Sec " + esc(report.section) : ""}</div>
    <div>Exam: <b>${esc(report.examTitle || "Assessment")}</b></div>
    <div>Attempt #${report.attemptNumber || 1}</div>
  </div>

  <div class="scorebar">
    <div class="scorebox"><div class="v">${report.obtainedMarks}/${report.totalMarks}</div><div class="l">Marks</div></div>
    <div class="scorebox"><div class="v">${report.percentage}%</div><div class="l">Percentage</div></div>
    <div class="scorebox"><div class="v ok">${report.correctAnswers}</div><div class="l">Correct</div></div>
    <div class="scorebox"><div class="v bad">${report.incorrectAnswers}</div><div class="l">Wrong</div></div>
    <div class="scorebox"><div class="v skip">${report.unattempted}</div><div class="l">Skipped</div></div>
    <div class="scorebox"><div class="v">${report.accuracy}%</div><div class="l">Accuracy</div></div>
  </div>

  ${forecastBlock}
  ${pointersBlock}
  ${topicBlock}

  <div class="section">
    <h2>Question Analysis</h2>
    <table>
      <thead><tr><th>#</th><th>Question</th><th>Topic</th><th>Lvl</th><th>Result</th><th>Marks</th></tr></thead>
      <tbody>${questionRows}</tbody>
    </table>
  </div>

  ${timeBlock}
  ${resourcesBlock}
  ${remarksBlock}

  <p class="note">ZeePrep · ${esc(subject)} · ${esc(report.studentName || "Student")} · Generated ${esc(generated)}</p>
</body>
</html>`;
}
