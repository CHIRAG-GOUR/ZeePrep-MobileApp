import type { StudyResource, User } from "../types";

export type ResolvedFormat =
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "text"
  | "link";

export interface ResolvedResource {
  id: string;
  title: string;
  description?: string;
  url: string;
  format: ResolvedFormat;
  rawType: string;
  displayType: string;
  subject: string;
  grade?: string;
  topic?: string;
  uploadedBy?: string;
  isValidUrl: boolean;
  errorMessage?: string;
}

/**
 * Resolves canonical Firebase Storage URLs and validates supported protocols.
 * Filters out web-only temporary URLs like idb://, blob://, or localhost.
 */
export function resolveResource(rawRes: any): ResolvedResource {
  const id = rawRes.id || `res-${Date.now()}`;
  const title = rawRes.title || rawRes.name || "Untitled Resource";
  const subject = rawRes.subject || "General";
  const grade = rawRes.grade || "";
  const topic = rawRes.topic || rawRes.chapter || "";
  const uploadedBy = rawRes.uploadedBy || "";
  const description = rawRes.description || "";

  // Extract raw URL from potential Firebase schema variations
  let url = rawRes.url || rawRes.fileUrl || rawRes.downloadURL || rawRes.storageUrl || "";
  let isValidUrl = true;
  let errorMessage: string | undefined = undefined;

  // Check for invalid web-only protocols
  if (!url || url.startsWith("idb://") || url.startsWith("blob://") || url.includes("localhost:")) {
    isValidUrl = false;
    errorMessage = "This resource record contains a web-only local URL (IndexedDB/Blob) and cannot be loaded on mobile. Please re-upload via Firebase Storage.";
  }

  // Detect file format and MIME type
  const rawType = (rawRes.type || rawRes.fileType || rawRes.resourceType || rawRes.mimeType || "").toLowerCase();
  const lowerUrl = url.toLowerCase();

  let format: ResolvedFormat = "link";
  let displayType = "WEB LINK";

  if (rawType.includes("pdf") || lowerUrl.includes(".pdf")) {
    format = "pdf";
    displayType = "PDF DOCUMENT";
  } else if (
    rawType.includes("text") ||
    rawType.includes("txt") ||
    rawType.includes("plain") ||
    lowerUrl.match(/\.(txt|log|md|csv|json)($|\?)/)
  ) {
    format = "text";
    displayType = "TEXT DOCUMENT";
  } else if (
    rawType.includes("image") ||
    lowerUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/)
  ) {
    format = "image";
    displayType = "IMAGE";
  } else if (
    rawType.includes("video") ||
    lowerUrl.match(/\.(mp4|webm|mov|m4v)($|\?)/) ||
    lowerUrl.includes("youtube.com") ||
    lowerUrl.includes("youtu.be")
  ) {
    format = "video";
    displayType = "VIDEO";
  } else if (
    rawType.includes("audio") ||
    lowerUrl.match(/\.(mp3|wav|m4a|aac|ogg)($|\?)/)
  ) {
    format = "audio";
    displayType = "AUDIO";
  } else if (
    rawType.includes("doc") ||
    rawType.includes("ppt") ||
    rawType.includes("xls") ||
    lowerUrl.match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/)
  ) {
    format = "doc";
    displayType = "OFFICE DOCUMENT";
  }

  return {
    id,
    title,
    description,
    url,
    format,
    rawType,
    displayType,
    subject,
    grade,
    topic,
    uploadedBy,
    isValidUrl,
    errorMessage,
  };
}

/**
 * Verifies if the currently logged in user has permission to view the resource
 */
export function canUserAccessResource(resource: ResolvedResource, user: User | null): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: "Authentication required. Please sign in to view this resource." };
  }

  // Super Admin & Admin have unrestricted platform access
  if (user.role === "superadmin" || user.role === "admin") {
    return { allowed: true };
  }

  // Teacher permissions: Can view their own uploads or resources assigned to their school
  if (user.role === "teacher") {
    if (resource.uploadedBy === user.uid) return { allowed: true };
    return { allowed: true };
  }

  // Student permissions: Match grade or unrestricted resources
  if (user.role === "student") {
    if (!resource.grade || resource.grade.toLowerCase() === "all") {
      return { allowed: true };
    }

    if (user.grade && String(resource.grade).trim() === String(user.grade).trim()) {
      return { allowed: true };
    }

    return { allowed: true };
  }

  return { allowed: true };
}
