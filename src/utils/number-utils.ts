/**
 * Safe Number Utility for ZeePrep Mobile App
 * Prevents NaN, null, undefined, Infinity, or string corruption in exam analytics and report scorecards.
 */

export function safeNumber(val: any, defaultVal = 0): number {
  if (val === undefined || val === null || val === "" || typeof val === "boolean") {
    return defaultVal;
  }
  const num = Number(val);
  return isNaN(num) || !isFinite(num) ? defaultVal : num;
}

export function safeInteger(val: any, defaultVal = 0): number {
  return Math.floor(safeNumber(val, defaultVal));
}

export function safePercentage(obtained: any, total: any): number {
  const obt = Math.max(0, safeNumber(obtained, 0));
  const tot = safeNumber(total, 0);
  if (tot <= 0) return 0;
  const pct = Math.round((obt / tot) * 100);
  return isNaN(pct) || !isFinite(pct) ? 0 : Math.min(100, Math.max(0, pct));
}

export function safeDuration(seconds: any): { mins: number; secs: number; formatted: string } {
  const totalSecs = Math.max(0, safeInteger(seconds, 0));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const formatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  return { mins, secs, formatted };
}
