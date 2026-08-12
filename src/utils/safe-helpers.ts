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

/**
 * Safely extracts string representation from a question option (string, object with text/label/value, null, undefined).
 * Prevents "Objects are not valid as a React child" crashes in Exam & Question Bank rendering.
 */
export function getOptionText(option: any, index?: number): string {
  if (option === null || option === undefined) return index !== undefined ? `Option ${index + 1}` : "";
  if (typeof option === "string") return option;
  if (typeof option === "number" || typeof option === "boolean") return String(option);
  if (typeof option === "object") {
    if (option.text && typeof option.text === "string") return option.text;
    if (option.label && typeof option.label === "string") return option.label;
    if (option.value && typeof option.value === "string") return option.value;
    if (option.optionText && typeof option.optionText === "string") return option.optionText;
    if (option.content && typeof option.content === "string") return option.content;
  }
  return index !== undefined ? `Option ${index + 1}` : "";
}

export function getDisplayName(userObj: any, fallback = "User"): string {
  if (!userObj) return fallback;
  if (typeof userObj === "string") return userObj;
  return safeString(userObj.name || userObj.displayName || userObj.email || fallback, fallback);
}

export function getSubjectName(obj: any, fallback = "General"): string {
  if (!obj) return fallback;
  if (typeof obj === "string") return obj;
  return safeString(obj.subject || obj.subjectName || obj.name || fallback, fallback);
}

export function getClassName(obj: any, fallback = "General"): string {
  if (!obj) return fallback;
  if (typeof obj === "string") return obj;
  return safeString(obj.grade || obj.class || obj.className || obj.classId || fallback, fallback);
}

export function getResourceType(obj: any, fallback = "pdf"): string {
  if (!obj) return fallback;
  if (typeof obj === "string") return obj;
  return safeString(obj.format || obj.type || obj.resourceType || fallback, fallback);
}

export function getFileExtension(filenameOrUrl: string): string {
  if (!filenameOrUrl || typeof filenameOrUrl !== "string") return "";
  const clean = filenameOrUrl.split("?")[0].split("#")[0];
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1 || lastDot === clean.length - 1) return "";
  return clean.substring(lastDot + 1).toLowerCase();
}
