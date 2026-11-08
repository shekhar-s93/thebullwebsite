import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { mapResource, RESOURCE_CONFIG, selectFor, type Resource, type ResourceType } from "./resources";

/** Browser client for admin pages. Row security only lets administrators write. */
export const db = supabase as unknown as SupabaseClient;

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  resource_type: ResourceType | "all";
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminPlatform {
  id: string;
  name: string;
  logo_url: string | null;
  is_custom: boolean;
  is_active: boolean;
  created_at: string;
}

export function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async (): Promise<AdminCategory[]> => {
      const { data, error } = await db.from("categories").select("*").order("name");
      throwIf(error);
      return (data ?? []) as AdminCategory[];
    },
  });
}

export function useAdminPlatforms() {
  return useQuery({
    queryKey: ["admin", "platforms"],
    queryFn: async (): Promise<AdminPlatform[]> => {
      const { data, error } = await db.from("video_platforms").select("*").order("name");
      throwIf(error);
      return (data ?? []) as AdminPlatform[];
    },
  });
}

export function useAdminResources(type: ResourceType) {
  return useQuery({
    queryKey: ["admin", "resources", type],
    queryFn: async (): Promise<Resource[]> => {
      const { data, error } = await db
        .from(RESOURCE_CONFIG[type].table)
        .select(selectFor(type))
        .order("created_at", { ascending: false });
      throwIf(error);
      return (data ?? []).map((row) => mapResource(type, row));
    },
  });
}

/** Refreshes admin lists and every public list/branding after a change. */
export function useRefreshAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}
