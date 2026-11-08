import { supabase } from "@/integrations/supabase/client";

import { resolveImageUrl, validateImageFile } from "./images";

export type MediaFolder = "videos" | "sites" | "applications" | "branding" | "categories" | "platforms";

export function mediaUrl(path: string): string {
  return `/api/public/media/${path}`;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadImage(file: File, folder: MediaFolder): Promise<{ path: string; url: string }> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);
  const path = `${folder}/${crypto.randomUUID()}.${EXT[file.type] ?? "jpg"}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return { path, url: mediaUrl(path) };
}

export async function removeImage(path: string | null | undefined): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from("media").remove([path]);
  if (error) console.warn("Could not remove old image", error.message);
}

/** Value held by the image picker in admin forms. */
export interface ImageValue {
  /** Which option is active: pasted link or uploaded file. */
  source: "url" | "upload";
  /** Link pasted by the admin (Google Drive or any image URL). */
  originalUrl: string;
  /** Already-uploaded image URL (when editing an item that has an uploaded image). */
  uploadedUrl: string | null;
  path: string | null;
  /** Newly chosen file waiting to be uploaded on save. */
  file: File | null;
  previewUrl: string | null;
}

export const EMPTY_IMAGE: ImageValue = {
  source: "url",
  originalUrl: "",
  uploadedUrl: null,
  path: null,
  file: null,
  previewUrl: null,
};

export function imageValueFrom(row: {
  image_source?: string | null;
  image_original_url?: string | null;
  image_url?: string | null;
  image_path?: string | null;
}): ImageValue {
  if (row.image_source === "upload") {
    return { ...EMPTY_IMAGE, source: "upload", uploadedUrl: row.image_url ?? null, path: row.image_path ?? null };
  }
  return { ...EMPTY_IMAGE, source: "url", originalUrl: row.image_original_url ?? row.image_url ?? "" };
}

export interface PersistedImage {
  image_source: "url" | "upload" | null;
  image_original_url: string | null;
  image_url: string | null;
  image_path: string | null;
}

/** Uploads a newly chosen file / resolves a pasted link and returns the columns to save. */
export async function persistImage(value: ImageValue, folder: MediaFolder): Promise<PersistedImage> {
  if (value.source === "upload") {
    if (value.file) {
      const { path, url } = await uploadImage(value.file, folder);
      return { image_source: "upload", image_original_url: null, image_url: url, image_path: path };
    }
    if (value.uploadedUrl) {
      return { image_source: "upload", image_original_url: null, image_url: value.uploadedUrl, image_path: value.path };
    }
    return { image_source: null, image_original_url: null, image_url: null, image_path: null };
  }
  if (value.source === "url" && value.originalUrl.trim()) {
    const resolved = resolveImageUrl(value.originalUrl);
    if (!resolved.ok) throw new Error(resolved.error);
    return {
      image_source: "url",
      image_original_url: value.originalUrl.trim(),
      image_url: resolved.url,
      image_path: null,
    };
  }
  return { image_source: null, image_original_url: null, image_url: null, image_path: null };
}
