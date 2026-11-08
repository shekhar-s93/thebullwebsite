// Image URL helpers shared by the public site and the admin forms.
// Google Drive sharing links are not direct image URLs, so we extract the file ID
// and serve it through Google's image endpoints.

const DRIVE_ID = "([a-zA-Z0-9_-]{10,})";

const DRIVE_PATTERNS: RegExp[] = [
  new RegExp(`drive\\.google\\.com/file/d/${DRIVE_ID}`),
  new RegExp(`drive\\.google\\.com/(?:open|uc|thumbnail)\\?(?:[^#]*&)?id=${DRIVE_ID}`),
  new RegExp(`docs\\.google\\.com/(?:uc|file/d/)\\??(?:[^#]*&)?(?:id=)?${DRIVE_ID}`),
  new RegExp(`drive\\.usercontent\\.google\\.com/(?:download|uc)\\?(?:[^#]*&)?id=${DRIVE_ID}`),
  new RegExp(`lh3\\.googleusercontent\\.com/d/${DRIVE_ID}`),
];

export function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isGoogleDriveUrl(value: string): boolean {
  return /(^|\/\/)(drive|docs)\.google\.com\/|drive\.usercontent\.google\.com\/|lh3\.googleusercontent\.com\/d\//.test(
    value,
  );
}

export function isGoogleDriveFolderUrl(value: string): boolean {
  return /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//.test(value);
}

/** Returns the Google Drive file ID from a sharing link, or null. */
export function extractGoogleDriveId(value: string | null | undefined): string | null {
  if (!value) return null;
  const input = value.trim();
  if (isGoogleDriveFolderUrl(input)) return null;
  for (const pattern of DRIVE_PATTERNS) {
    const match = input.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function driveImageUrl(id: string): string {
  return `https://lh3.googleusercontent.com/d/${id}=w1600`;
}

export function driveThumbnailUrl(id: string): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
}

export type ResolvedImage =
  | { ok: true; url: string; driveId: string | null }
  | { ok: false; error: string };

/** Converts any pasted image link (Google Drive or direct) into a displayable URL. */
export function resolveImageUrl(value: string | null | undefined): ResolvedImage {
  const input = (value ?? "").trim();
  if (!input) return { ok: false, error: "Paste an image link." };
  if (!isHttpUrl(input)) return { ok: false, error: "Enter a link that starts with http:// or https://" };
  if (isGoogleDriveFolderUrl(input)) {
    return { ok: false, error: "This is a Google Drive folder link. Open the image itself and copy its share link." };
  }
  const driveId = extractGoogleDriveId(input);
  if (driveId) return { ok: true, url: driveImageUrl(driveId), driveId };
  if (isGoogleDriveUrl(input)) {
    return { ok: false, error: "We couldn't find a file ID in this Google Drive link." };
  }
  return { ok: true, url: input, driveId: null };
}

/** Ordered list of URLs to try when displaying an image (fallbacks for Drive). */
export function imageCandidates(src: string | null | undefined): string[] {
  if (!src) return [];
  const driveId = extractGoogleDriveId(src);
  if (!driveId) return [src];
  return Array.from(new Set([src, driveImageUrl(driveId), driveThumbnailUrl(driveId)]));
}

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Please choose a JPG, PNG, WebP or GIF image.";
  if (file.size > MAX_IMAGE_BYTES) return "Images must be 10 MB or smaller.";
  return null;
}
