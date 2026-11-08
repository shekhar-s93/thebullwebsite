import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, SearchX, Star, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ResourceCard, ResourceCardSkeleton, ResourceGrid } from "@/components/ResourceCard";
import { SearchField } from "@/components/SearchField";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listResources } from "@/lib/public.functions";
import { categoriesQuery, platformsQuery } from "@/lib/queries";
import {
  APP_PLATFORMS,
  RESOURCE_CONFIG,
  SORT_OPTIONS,
  type DirectorySearch,
  type ResourceType,
  type SortKey,
} from "@/lib/resources";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const ALL = "__all";

interface DirectoryProps {
  type: ResourceType;
  title: string;
  description: string;
  search: DirectorySearch;
  onSearchChange: (next: DirectorySearch) => void;
}

export function Directory({ type, title, description, search, onSearchChange }: DirectoryProps) {
  const config = RESOURCE_CONFIG[type];
  const [text, setText] = useState(search.q ?? "");

  useEffect(() => setText(search.q ?? ""), [search.q]);

  // Debounce typing into the URL.
  useEffect(() => {
    const handle = setTimeout(() => {
      if ((search.q ?? "") !== text.trim()) onSearchChange({ ...search, q: text.trim() || undefined });
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const categories = useQuery(categoriesQuery(type));
  const platforms = useQuery({ ...platformsQuery, enabled: type === "video" });

  const filters = {
    type,
    q: search.q,
    categoryId: search.category,
    platform: search.platform,
    featured: search.featured,
    sort: search.sort ?? "newest",
  } as const;

  const query = useInfiniteQuery({
    queryKey: ["resources", filters],
    queryFn: ({ pageParam }) => listResources({ data: { ...filters, offset: pageParam, limit: PAGE_SIZE } }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const hasFilters = !!(search.q || search.category || search.platform || search.featured || search.sort);

  const platformOptions =
    type === "video"
      ? (platforms.data ?? []).map((p) => ({ value: p.id, label: p.name }))
      : type === "application"
        ? APP_PLATFORMS.map((p) => ({ value: p, label: p }))
        : [];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Directory</p>
        <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      </header>

      <div className="mb-8 space-y-4 rounded-2xl border border-border/70 bg-surface p-4 sm:p-5">
        <SearchField
          value={text}
          onChange={setText}
          placeholder={`Search ${config.plural.toLowerCase()} by name, description or category…`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Category"
            value={search.category}
            onChange={(v) => onSearchChange({ ...search, category: v })}
            options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            allLabel="All categories"
          />
          {platformOptions.length > 0 && (
            <FilterSelect
              label="Platform"
              value={search.platform}
              onChange={(v) => onSearchChange({ ...search, platform: v })}
              options={platformOptions}
              allLabel="All platforms"
            />
          )}
          <Select
            value={search.sort ?? "newest"}
            onValueChange={(v) => onSearchChange({ ...search, sort: v === "newest" ? undefined : (v as SortKey) })}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={search.featured ? "default" : "outline"}
            onClick={() => onSearchChange({ ...search, featured: search.featured ? undefined : true })}
            aria-pressed={!!search.featured}
            className="rounded-full"
          >
            <Star className={cn("h-4 w-4", search.featured && "fill-current")} /> Featured only
          </Button>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setText("");
                onSearchChange({});
              }}
            >
              <X className="h-4 w-4" /> Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
        <span aria-live="polite">
          {query.isPending ? "Loading…" : `${total} ${total === 1 ? config.label.toLowerCase() : config.plural.toLowerCase()}`}
        </span>
        {query.isFetching && !query.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-label="Updating" />}
      </div>

      {query.isError ? (
        <StateBox
          icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
          title="Something went wrong"
          text="We couldn't load this list. Please try again."
          action={<Button onClick={() => query.refetch()}>Try again</Button>}
        />
      ) : query.isPending ? (
        <ResourceGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </ResourceGrid>
      ) : items.length === 0 ? (
        <StateBox
          icon={<SearchX className="h-8 w-8 text-muted-foreground" />}
          title={`No ${config.plural.toLowerCase()} found`}
          text={hasFilters ? "Try different keywords or clear your filters." : "Check back soon — new picks are added regularly."}
          action={
            hasFilters ? (
              <Button variant="outline" onClick={() => onSearchChange({})}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <ResourceGrid>
            {items.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </ResourceGrid>
          {query.hasNextPage && (
            <div className="mt-10 flex justify-center">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />} Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger className="w-full sm:w-52" aria-label={label}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StateBox({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}
