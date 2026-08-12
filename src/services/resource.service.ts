import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { db, storage } from "../lib/firebase";
import type { User } from "../types";

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try { localStorage.setItem(key, value); } catch (e) {}
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

export type ResourceTypeFormat =
  | "pdf"
  | "word"
  | "excel"
  | "image"
  | "video"
  | "audio"
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
 * Auto-detects resource format from file name, URL or MIME type
 */
export function autoDetectFileFormat(fileNameOrUrl: string, mimeType: string = ""): { format: ResourceTypeFormat; displayType: string } {
  const str = (fileNameOrUrl || "").toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  if (mime.includes("pdf") || str.includes(".pdf")) {
    return { format: "pdf", displayType: "PDF DOCUMENT" };
  }
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml") ||
    str.match(/\.(docx|doc)($|\?)/)
  ) {
    return { format: "word", displayType: "WORD DOC" };
  }
  if (
    mime.includes("excel") ||
    mime.includes("spreadsheet") ||
    mime.includes("csv") ||
    str.match(/\.(xlsx|xls|csv)($|\?)/)
  ) {
    return { format: "excel", displayType: "EXCEL WORKSHEET" };
  }
  if (
    mime.includes("video") ||
    str.match(/\.(mp4|mov|webm|avi|m4v)($|\?)/) ||
    str.includes("youtube.com") ||
    str.includes("youtu.be")
  ) {
    return { format: "video", displayType: "VIDEO LECTURE" };
  }
  if (
    mime.includes("audio") ||
    str.match(/\.(mp3|wav|m4a|aac|ogg)($|\?)/)
  ) {
    return { format: "audio", displayType: "AUDIO LECTURE" };
  }
  if (
    mime.includes("image") ||
    str.match(/\.(png|jpg|jpeg|webp|gif|svg)($|\?)/)
  ) {
    return { format: "image", displayType: "IMAGE / DIAGRAM" };
  }
  if (
    mime.includes("text") ||
    mime.includes("json") ||
    str.match(/\.(txt|md|json|log)($|\?)/)
  ) {
    return { format: "text", displayType: "TEXT / NOTES" };
  }

  return { format: "link", displayType: "WEB LINK" };
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
  const rawType = (rawRes.type || rawRes.format || rawRes.resourceType || rawRes.fileType || rawRes.mimeType || "").toLowerCase();
  const mimeType = rawRes.mimeType || "";
  const detected = autoDetectFileFormat(url || title || storagePath, mimeType || rawType);

  return {
    id,
    title,
    description,
    url,
    storagePath,
    format: detected.format,
    rawType,
    displayType: detected.displayType,
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
 * Queries both 'study_resources' and 'resources' collections, deduplicates by ID,
 * and caches locally via AsyncStorage for robust cold-start persistence.
 */
export async function getResourcesForUser(user: User | null): Promise<NormalizedResource[]> {
  const CACHE_KEY = "zeeprep_cached_resources";

  // 1. Try to load cached resources for instant cold-start display
  let cachedList: NormalizedResource[] = [];
  try {
    const rawCache = await getStorageItem(CACHE_KEY);
    if (rawCache) {
      cachedList = JSON.parse(rawCache);
    }
  } catch (e) {
    // Ignore cache parse error
  }

  try {
    const resourcesMap = new Map<string, NormalizedResource>();

    // Query 'study_resources' collection
    try {
      const snap1 = await getDocs(collection(db, "study_resources"));
      snap1.forEach((docSnap) => {
        const raw = { ...docSnap.data(), id: docSnap.id };
        const normalized = normalizeResource(raw);
        const perm = canUserAccessResource(normalized, user);
        if (perm.allowed) {
          resourcesMap.set(normalized.id, normalized);
        }
      });
    } catch (e1) {
      console.warn("Notice querying study_resources:", e1);
    }

    // Query 'resources' collection
    try {
      const snap2 = await getDocs(collection(db, "resources"));
      snap2.forEach((docSnap) => {
        const raw = { ...docSnap.data(), id: docSnap.id };
        const normalized = normalizeResource(raw);
        const perm = canUserAccessResource(normalized, user);
        if (perm.allowed && !resourcesMap.has(normalized.id)) {
          resourcesMap.set(normalized.id, normalized);
        }
      });
    } catch (e2) {
      console.warn("Notice querying resources:", e2);
    }

    const list = Array.from(resourcesMap.values());

    // Sort by createdAt descending
    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    if (list.length > 0) {
      // Save to persistent storage
      setStorageItem(CACHE_KEY, JSON.stringify(list)).catch(() => {});
      return list;
    }

    return cachedList.length > 0 ? cachedList : list;
  } catch (error) {
    console.error("Error fetching study resources:", error);
    return cachedList;
  }
}

/**
 * Uploads a local file blob to Firebase Storage and returns its canonical storagePath & downloadUrl.
 * Ensures zero local-only (idb://, blob:, file://) URLs are saved as permanent resource sources in Firestore.
 */
export async function uploadResourceFileToStorage(
  fileUri: string,
  fileName: string,
  grade: string = "General",
  subject: string = "General"
): Promise<{ storagePath: string; downloadUrl: string } | null> {
  if (!storage) {
    console.error("Firebase Storage instance not initialized.");
    return null;
  }

  // If already a remote web/http URL, return as-is
  if (fileUri.startsWith("http://") || fileUri.startsWith("https://")) {
    return { storagePath: "", downloadUrl: fileUri };
  }

  try {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const sanitizedGrade = (grade || "General").replace(/[^a-zA-Z0-9_-]/g, "_");
    const sanitizedSubject = (subject || "General").replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `study_resources/${sanitizedGrade}/${sanitizedSubject}/${Date.now()}_${cleanFileName}`;

    const storageRef = ref(storage, storagePath);

    // Fetch local file URI into a blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload blob to Firebase Storage
    await uploadBytes(storageRef, blob);

    // Retrieve canonical download URL
    const downloadUrl = await getDownloadURL(storageRef);

    return { storagePath, downloadUrl };
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error);
    return null;
  }
}
