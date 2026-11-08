import { queryOptions } from "@tanstack/react-query";

import { getBranding, getHomeData, listCategories, listPlatforms } from "./public.functions";
import type { ResourceType } from "./resources";

export const brandingQuery = queryOptions({
  queryKey: ["branding"],
  queryFn: () => getBranding(),
  staleTime: 60_000,
});

export const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHomeData(),
  staleTime: 30_000,
});

export const categoriesQuery = (type?: ResourceType) =>
  queryOptions({
    queryKey: ["public-categories", type ?? "all"],
    queryFn: () => listCategories({ data: { type } }),
    staleTime: 60_000,
  });

export const platformsQuery = queryOptions({
  queryKey: ["public-platforms"],
  queryFn: () => listPlatforms(),
  staleTime: 60_000,
});
