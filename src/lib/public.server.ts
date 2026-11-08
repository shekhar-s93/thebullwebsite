import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  mapResource,
  RESOURCE_CONFIG,
  sanitizeSearchTerm,
  selectFor,
  type Resource,
  type ResourceType,
  type SortKey,
} from "./resources";

/** Read-only client for public data (anon role, RLS shows only published rows). */
export function publicClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Backend is not configured");
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export interface ResourceQuery {
  type: ResourceType;
  q?: string;
  categoryId?: string;
  platform?: string;
  featured?: boolean;
  sort?: SortKey;
  offset?: number;
  limit?: number;
}

export async function queryResources(
  client: SupabaseClient,
  params: ResourceQuery,
): Promise<{ items: Resource[]; total: number }> {
  const { type, sort = "newest", offset = 0, limit = 12 } = params;
  const table = RESOURCE_CONFIG[type].table;
  let query = client.from(table).select(selectFor(type), { count: "exact" }).eq("is_published", true);

  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.featured) query = query.eq("is_featured", true);
  if (params.platform) {
    if (type === "video") query = query.eq("platform_id", params.platform);
    if (type === "application") query = query.eq("app_platform", params.platform);
  }

  const term = params.q ? sanitizeSearchTerm(params.q) : "";
  if (term) {
    const pattern = `%${term}%`;
    const { data: cats } = await client.from("categories").select("id").ilike("name", pattern).limit(50);
    const catIds = (cats ?? []).map((c: { id: string }) => c.id);
    const filters = [`title.ilike.${pattern}`, `description.ilike.${pattern}`];
    if (catIds.length) filters.push(`category_id.in.(${catIds.join(",")})`);
    query = query.or(filters.join(","));
  }

  if (sort === "featured") query = query.order("is_featured", { ascending: false });
  query = query.order("created_at", { ascending: sort === "oldest" }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error(`queryResources(${type}) failed`, error);
    throw new Error("Could not load resources. Please try again.");
  }
  return { items: (data ?? []).map((row) => mapResource(type, row)), total: count ?? 0 };
}
