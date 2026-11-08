import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { publicClient, queryResources } from "./public.server";
import { RESOURCE_TYPES, type Resource, type ResourceType } from "./resources";

export interface Branding {
  site_name: string;
  tagline: string;
  site_description: string;
  logo_mode: "default" | "url" | "upload" | "none";
  logo_url: string | null;
}

export const DEFAULT_BRANDING: Branding = {
  site_name: "TheBull",
  tagline: "Discover Videos, Websites & Applications",
  site_description:
    "TheBull is a curated platform for discovering the best videos, websites and applications — hand-picked and organized so you can find what matters, fast.",
  logo_mode: "default",
  logo_url: null,
};

export const getBranding = createServerFn({ method: "GET" }).handler(async (): Promise<Branding> => {
  try {
    const { data, error } = await publicClient()
      .from("site_settings")
      .select("site_name, tagline, site_description, logo_mode, logo_url")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return DEFAULT_BRANDING;
    return data as Branding;
  } catch (e) {
    console.error("getBranding failed", e);
    return DEFAULT_BRANDING;
  }
});

const typeSchema = z.enum(["video", "site", "application"]);

const listSchema = z.object({
  type: typeSchema,
  q: z.string().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  platform: z.string().max(80).optional(),
  featured: z.boolean().optional(),
  sort: z.enum(["newest", "oldest", "featured"]).optional(),
  offset: z.number().int().min(0).max(10000).default(0),
  limit: z.number().int().min(1).max(48).default(12),
});

export const listResources = createServerFn({ method: "GET" })
  .inputValidator((input: z.input<typeof listSchema>) => listSchema.parse(input))
  .handler(async ({ data }) => queryResources(publicClient(), data));

export interface PublicCategory {
  id: string;
  name: string;
  description: string | null;
  resource_type: ResourceType | "all";
  image_url: string | null;
  count: number;
}

export const listCategories = createServerFn({ method: "GET" })
  .inputValidator((input: { type?: ResourceType }) => z.object({ type: typeSchema.optional() }).parse(input))
  .handler(async ({ data }): Promise<PublicCategory[]> => {
    let query = publicClient()
      .from("categories")
      .select("id, name, description, resource_type, image_url")
      .eq("is_active", true)
      .order("name");
    if (data.type) query = query.in("resource_type", [data.type, "all"]);
    const { data: rows, error } = await query;
    if (error) throw new Error("Could not load categories.");
    return (rows ?? []).map((r) => ({ ...(r as Omit<PublicCategory, "count">), count: 0 }));
  });

export interface PublicPlatform {
  id: string;
  name: string;
  logo_url: string | null;
}

export const listPlatforms = createServerFn({ method: "GET" }).handler(async (): Promise<PublicPlatform[]> => {
  const { data, error } = await publicClient()
    .from("video_platforms")
    .select("id, name, logo_url")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error("Could not load platforms.");
  return (data ?? []) as PublicPlatform[];
});

export interface HomeData {
  featured: Record<ResourceType, Resource[]>;
  recent: Resource[];
  categories: PublicCategory[];
}

export const getHomeData = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  const client = publicClient();
  const [fv, fs, fa, rv, rs, ra, cats] = await Promise.all([
    queryResources(client, { type: "video", featured: true, limit: 6 }),
    queryResources(client, { type: "site", featured: true, limit: 6 }),
    queryResources(client, { type: "application", featured: true, limit: 6 }),
    queryResources(client, { type: "video", limit: 8 }),
    queryResources(client, { type: "site", limit: 8 }),
    queryResources(client, { type: "application", limit: 8 }),
    client
      .from("categories")
      .select("id, name, description, resource_type, image_url, videos(count), sites(count), applications(count)")
      .eq("is_active", true),
  ]);

  const recent = [...rv.items, ...rs.items, ...ra.items]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories: PublicCategory[] = (cats.data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    resource_type: c.resource_type,
    image_url: c.image_url,
    count: (c.videos?.[0]?.count ?? 0) + (c.sites?.[0]?.count ?? 0) + (c.applications?.[0]?.count ?? 0),
  }));
  categories.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    featured: { video: fv.items, site: fs.items, application: fa.items },
    recent,
    categories: categories.slice(0, 8),
  };
});

const searchSchema = z.object({
  q: z.string().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  types: z.array(typeSchema).optional(),
});

export const searchAll = createServerFn({ method: "GET" })
  .inputValidator((input: z.input<typeof searchSchema>) => searchSchema.parse(input))
  .handler(async ({ data }) => {
    const client = publicClient();
    const types = data.types?.length ? data.types : RESOURCE_TYPES;
    const results = await Promise.all(
      types.map((type) => queryResources(client, { type, q: data.q, categoryId: data.categoryId, limit: 24 })),
    );
    const out: Partial<Record<ResourceType, { items: Resource[]; total: number }>> = {};
    types.forEach((t, i) => (out[t] = results[i]));
    return out;
  });
