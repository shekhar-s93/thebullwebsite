// Shared resource types and labels (browser + server safe).

export type ResourceType = "video" | "site" | "application";
export const RESOURCE_TYPES: ResourceType[] = ["video", "site", "application"];

export const RESOURCE_CONFIG = {
  video: {
    table: "videos",
    label: "Video",
    plural: "Videos",
    path: "/videos",
    nameLabel: "Video Title",
    urlLabel: "Video URL",
    cta: "View Video",
    folder: "videos",
  },
  site: {
    table: "sites",
    label: "Site",
    plural: "Sites",
    path: "/sites",
    nameLabel: "Website Name",
    urlLabel: "Website URL",
    cta: "Visit Website",
    folder: "sites",
  },
  application: {
    table: "applications",
    label: "Application",
    plural: "Applications",
    path: "/applications",
    nameLabel: "Application Name",
    urlLabel: "Application URL",
    cta: "Get Application",
    folder: "applications",
  },
} as const satisfies Record<ResourceType, Record<string, string>>;

export const APP_PLATFORMS = ["Windows", "macOS", "Linux", "Android", "iOS", "Web", "Cross-platform"] as const;
export type AppPlatform = (typeof APP_PLATFORMS)[number];

export type SortKey = "newest" | "oldest" | "featured";
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "featured", label: "Featured first" },
];

export interface CategoryRef {
  id: string;
  name: string;
}

export interface PlatformRef {
  id: string;
  name: string;
  logo_url: string | null;
  is_custom?: boolean;
}

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  description: string | null;
  image_source: "url" | "upload" | null;
  image_original_url: string | null;
  image_url: string | null;
  image_path: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  category_id: string | null;
  category: CategoryRef | null;
  platform_id?: string | null;
  platform?: PlatformRef | null;
  custom_platform_name?: string | null;
  app_platform?: string | null;
}

export function selectFor(type: ResourceType): string {
  if (type === "video") return "*, category:categories(id,name), platform:video_platforms(id,name,logo_url,is_custom)";
  return "*, category:categories(id,name)";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapResource(type: ResourceType, row: any): Resource {
  return {
    ...row,
    type,
    category: row.category ?? null,
    platform: row.platform ?? null,
  } as Resource;
}

export function platformLabel(r: Resource): string | null {
  if (r.type === "video") {
    if (r.custom_platform_name && (!r.platform || r.platform.is_custom)) return r.custom_platform_name;
    return r.platform?.name ?? r.custom_platform_name ?? null;
  }
  if (r.type === "application") return r.app_platform ?? null;
  return null;
}

export type DirectorySearch = {
  q?: string;
  category?: string;
  platform?: string;
  featured?: boolean;
  sort?: SortKey;
};

export function parseDirectorySearch(search: Record<string, unknown>): DirectorySearch {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : undefined);
  const sort = str(search.sort);
  return {
    q: str(search.q),
    category: str(search.category),
    platform: str(search.platform),
    featured: search.featured === true || search.featured === "true" || search.featured === "1" ? true : undefined,
    sort: sort === "oldest" || sort === "featured" || sort === "newest" ? sort : undefined,
  };
}

/** Removes characters that would break a PostgREST filter expression. */
export function sanitizeSearchTerm(q: string): string {
  return q
    .replace(/[,()*%\\:"'.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
