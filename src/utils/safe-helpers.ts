/**
 * Application-wide defensive data helpers and error formatters.
 * Prevents runtime crashes from undefined/null property access or invalid method calls.
 */

export function safeString(val: any, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (val.text && typeof val.text === "string") return val.text;
    if (val.label && typeof val.label === "string") return val.label;
    if (val.name && typeof val.name === "string") return val.name;
    if (val.title && typeof val.title === "string") return val.title;
  }
  return fallback;
}

export function safeUpperCase(val: any, fallback = ""): string {
  const str = safeString(val, fallback);
  return str ? str.toUpperCase() : fallback;
}

export function safeLowerCase(val: any, fallback = ""): string {
  const str = safeString(val, fallback);
  return str ? str.toLowerCase() : fallback;
}

export function safeArray<T = any>(val: any): T[] {
  if (Array.isArray(val)) return val;
  return [];
}

export function safeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

export function formatFirebaseError(error: any): string {
  if (!error) return "An unexpected error occurred.";

  const code = error.code || error.message || "";
  if (code.includes("permission-denied")) {
    return "Permission Denied: You do not have access to this resource or operation.";
  }
  if (code.includes("unauthenticated") || code.includes("auth/user-not-found")) {
    return "Authentication Error: Please sign in again.";
  }
  if (code.includes("unavailable") || code.includes("network-request-failed")) {
    return "Network Offline: Please check your internet connection and try again.";
  }
  if (code.includes("not-found")) {
    return "Record Not Found: The requested data does not exist in Firebase.";
  }
  if (code.includes("already-exists")) {
    return "Duplicate Item: This record already exists in the platform.";
  }

  return error.message || "Operation failed. Please try again.";
}
