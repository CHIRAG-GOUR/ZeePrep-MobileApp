import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import type { User } from "../types";

export type ResourceTypeFormat =
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "doc"
  | "text"
  | "link";

export interface NormalizedResource {
  id: string;
  title: string;
  description: string;
  url: string;
  storagePath: string;
  format: ResourceTypeFormat;
  rawType: string;
  displayType: string;
  mimeType: string;
  subject: string;
  grade: string;
  section: string;
  topic: string;
  chapter: string;
  board: string;
  academicSession: string;
  uploadedBy: string;
  createdAt: string;
  isValidUrl: boolean;
  errorMessage?: string;
}

/**
 * Normalizes raw Firestore resource document schemas used across web and mobile apps.
 */
export function normalizeResource(rawRes: any): NormalizedResource {
  const id = rawRes.id || `res-${Date.now()}`;
  const title = rawRes.title || rawRes.name || "Untitled Resource";
  const description = rawRes.description || "";
  const subject = rawRes.subject || "General";
  const grade = rawRes.grade || rawRes.classId || "";
  const section = rawRes.section || rawRes.sectionId || "";
  const topic = rawRes.topic || rawRes.chapter || "";
  const chapter = rawRes.chapter || "";
  const board = rawRes.board || "";
  const academicSession = rawRes.academicSession || "";
  const uploadedBy = rawRes.uploadedBy || "";
  const createdAt = rawRes.createdAt || new Date().toISOString();

  // Extract storage path if available
  const storagePath = rawRes.storagePath || rawRes.filePath || rawRes.path || "";

  // Extract raw URL from potential Firebase schema variations
  let url = rawRes.url || rawRes.downloadURL || rawRes.downloadUrl || rawRes.fileUrl || rawRes.storageUrl || rawRes.externalUrl || "";
  let isValidUrl = true;
  let errorMessage: string | undefined = undefined;

  // Check for invalid web-only protocols
  if (!url && !storagePath) {
    isValidUrl = false;
    errorMessage = "This resource record has no valid URL or storage path.";
  } else if (url && (url.startsWith("idb://") || url.startsWith("blob://") || url.includes("localhost:"))) {
    isValidUrl = false;
    errorMessage = "This resource record contains a web-only local URL (IndexedDB/Blob) and cannot be loaded on mobile. Please re-upload via Firebase Storage.";
  }

  // Detect file format and MIME type
  const rawType = (rawRes.type || rawRes.resourceType || rawRes.fileType || rawRes.mimeType || "").toLowerCase();
  const mimeType = rawRes.mimeType || "";
  const lowerUrl = url.toLowerCase();
  const lowerPath = storagePath.toLowerCase();

  let format: ResourceTypeFormat = "link";
  let displayType = "WEB LINK";

  if (rawType.includes("pdf") || lowerUrl.includes(".pdf") || lowerPath.includes(".pdf")) {
    format = "pdf";
    displayType = "PDF DOCUMENT";
  } else if (
    rawType.includes("text") ||
    rawType.includes("txt") ||
    rawType.includes("plain") ||
    lowerUrl.match(/\.(txt|log|md|csv|json)($|\?)/) ||
    lowerPath.match(/\.(txt|log|md|csv|json)($|\?)/)
  ) {
    format = "text";
    displayType = "TEXT DOCUMENT";
  } else if (
    rawType.includes("image") ||
    lowerUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/) ||
    lowerPath.match(/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/)
  ) {
    format = "image";
    displayType = "IMAGE";
  } else if (
    rawType.includes("video") ||
    lowerUrl.match(/\.(mp4|webm|mov|m4v)($|\?)/) ||
    lowerPath.match(/\.(mp4|webm|mov|m4v)($|\?)/) ||
    lowerUrl.includes("youtube.com") ||
    lowerUrl.includes("youtu.be")
  ) {
    format = "video";
    displayType = "VIDEO";
  } else if (
    rawType.includes("audio") ||
    lowerUrl.match(/\.(mp3|wav|m4a|aac|ogg)($|\?)/) ||
    lowerPath.match(/\.(mp3|wav|m4a|aac|ogg)($|\?)/)
  ) {
    format = "audio";
    displayType = "AUDIO";
  } else if (
    rawType.includes("doc") ||
    rawType.includes("ppt") ||
    rawType.includes("xls") ||
    lowerUrl.match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/) ||
    lowerPath.match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/)
  ) {
    format = "doc";
    displayType = "OFFICE DOCUMENT";
  }

  return {
    id,
    title,
    description,
    url,
    storagePath,
    format,
    rawType,
    displayType,
    mimeType,
    subject,
    grade,
    section,
    topic,
    chapter,
    board,
    academicSession,
    uploadedBy,
    createdAt,
    isValidUrl,
    errorMessage,
  };
}

/**
 * Resolves a canonical, working Firebase Storage download URL.
 * Encodes object paths containing slashes (%2F) to prevent HTTP 400 Bad Request errors.
 */
export async function resolveResourceUrl(resource: NormalizedResource): Promise<string> {
  // 1. If a storagePath is available, use Firebase Storage SDK getDownloadURL
  if (resource.storagePath && storage) {
    try {
      const storageRef = ref(storage, resource.storagePath);
      const sdkUrl = await getDownloadURL(storageRef);
      if (sdkUrl) return sdkUrl;
    } catch (sdkErr) {
      console.warn(`[Firebase Storage SDK] Error resolving storagePath ${resource.storagePath}:`, sdkErr);
    }
  }

  let rawUrl = resource.url;
  if (!rawUrl) return "";

  // 2. Fix HTTP 400 Bad Request on Firebase Storage URLs with unencoded slashes in path
  if (rawUrl.includes("firebasestorage.googleapis.com/v0/b/") && rawUrl.includes("/o/")) {
    try {
      const parts = rawUrl.split("/o/");
      const baseUrl = parts[0]; // https://firebasestorage.googleapis.com/v0/b/bucket
      const objectAndQuery = parts[1]; // path/to/file.txt?alt=media&token=...

      if (objectAndQuery) {
        const queryIndex = objectAndQuery.indexOf("?");
        let objectPath = queryIndex !== -1 ? objectAndQuery.substring(0, queryIndex) : objectAndQuery;
        const queryString = queryIndex !== -1 ? objectAndQuery.substring(queryIndex) : "?alt=media";

        // If path contains unencoded slashes (e.g. study_resources/Grade_6/Science/file.txt)
        if (objectPath.includes("/") && !objectPath.includes("%2F")) {
          const encodedObjectPath = objectPath.split("/").map(encodeURIComponent).join("%2F");
          const fixedUrl = `${baseUrl}/o/${encodedObjectPath}${queryString}`;
          return fixedUrl;
        }
      }
    } catch (fixErr) {
      console.warn("Error normalizing Firebase Storage URL path encoding:", fixErr);
    }
  }

  return rawUrl;
}

/**
 * Verifies user access permissions against the resource.
 */
export function canUserAccessResource(resource: NormalizedResource, user: User | null): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: "Authentication required. Please sign in to view this resource." };
  }

  // Super Admin & Admin have unrestricted platform access
  if (user.role === "superadmin" || user.role === "admin") {
    return { allowed: true };
  }

  // Teacher permissions: Can view their own uploads or resources assigned to their subject/school
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

/**
 * Fetches and normalizes study resources for the authenticated user from Firestore.
 */
export async function getResourcesForUser(user: User | null): Promise<NormalizedResource[]> {
  try {
    let snapshot;
    try {
      snapshot = await getDocs(collection(db, "study_resources"));
    } catch (e1) {
      snapshot = await getDocs(collection(db, "resources"));
    }

    const list: NormalizedResource[] = [];
    snapshot.forEach((docSnap) => {
      const raw = { ...docSnap.data(), id: docSnap.id };
      const normalized = normalizeResource(raw);

      // Verify access permissions
      const perm = canUserAccessResource(normalized, user);
      if (perm.allowed) {
        list.push(normalized);
      }
    });

    // Client-side sort by createdAt descending
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return list;
  } catch (err) {
    console.error("Error fetching resources in resource.service:", err);
    return [];
  }
}
