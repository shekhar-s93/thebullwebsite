import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, SearchX } from "lucide-react";
import { useEffect, useState } from "react";

import { StateBox } from "@/components/Directory";
import { ResourceCard, ResourceCardSkeleton, ResourceGrid } from "@/components/ResourceCard";
import { SearchField } from "@/components/SearchField";
import { Button } from "@/components/ui/button";
import { searchAll } from "@/lib/public.functions";
import { RESOURCE_CONFIG, RESOURCE_TYPES, type ResourceType } from "@/lib/resources";
import { cn } from "@/lib/utils";

type SearchParams = { q?: string; type?: ResourceType; category?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q.trim().slice(0, 120) : undefined,
    type: s.type === "video" || s.type === "site" || s.type === "application" ? s.type : undefined,
    category: typeof s.category === "string" && /^[0-9a-f-]{36}$/i.test(s.category) ? s.category : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search — TheBull" },
      { name: "description", content: "Search every video, website and application on TheBull in one place." },
      { property: "og:title", content: "Search — TheBull" },
      { property: "og:description", content: "Search across all curated videos, websites and applications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [text, setText] = useState(search.q ?? "");

  useEffect(() => setText(search.q ?? ""), [search.q]);
  useEffect(() => {
    const h = setTimeout(() => {
      if ((search.q ?? "") !== text.trim()) navigate({ search: { ...search, q: text.trim() || undefined }, replace: true });
    }, 350);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const query = useQuery({
    queryKey: ["search", search],
    queryFn: () =>
      searchAll({ data: { q: search.q, categoryId: search.category, types: search.type ? [search.type] : undefined } }),
    placeholderData: keepPreviousData,
  });

  const groups = RESOURCE_TYPES.filter((t) => !search.type || t === search.type);
  const totalFound = groups.reduce((n, t) => n + (query.data?.[t]?.total ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold sm:text-5xl">Search</h1>
      <p className="mt-3 text-lg text-muted-foreground">Find videos, websites and applications across TheBull.</p>

      <div className="mt-8 space-y-4">
        <SearchField value={text} onChange={setText} placeholder="Search by name, description or category…" size="lg" autoFocus />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Resource type">
          {[undefined, ...RESOURCE_TYPES].map((t) => (
            <button
              key={t ?? "all"}
              role="tab"
              aria-selected={search.type === t}
              onClick={() => navigate({ search: { ...search, type: t }, replace: true })}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                search.type === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {t ? RESOURCE_CONFIG[t].plural : "All"}
            </button>
          ))}
          {(search.q || search.category || search.type) && (
            <Button variant="ghost" onClick={() => { setText(""); navigate({ search: {}, replace: true }); }}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="mt-10 space-y-14">
        {query.isError ? (
          <StateBox
            icon={<AlertTriangle className="h-8 w-8 text-destructive" />}
            title="Search failed"
            text="Please try again in a moment."
            action={<Button onClick={() => query.refetch()}>Try again</Button>}
          />
        ) : query.isPending ? (
          <ResourceGrid>
            {Array.from({ length: 4 }).map((_, i) => <ResourceCardSkeleton key={i} />)}
          </ResourceGrid>
        ) : totalFound === 0 ? (
          <StateBox
            icon={<SearchX className="h-8 w-8 text-muted-foreground" />}
            title="No results"
            text={search.q ? `Nothing matched “${search.q}”. Try another keyword.` : "Nothing has been published yet."}
          />
        ) : (
          groups.map((t) => {
            const group = query.data?.[t];
            if (!group || group.items.length === 0) return null;
            const config = RESOURCE_CONFIG[t];
            return (
              <section key={t} aria-labelledby={`results-${t}`}>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <h2 id={`results-${t}`} className="text-2xl font-bold">
                    {config.plural} <span className="text-base font-medium text-muted-foreground">({group.total})</span>
                  </h2>
                  {group.total > group.items.length && (
                    <Link
                      to={config.path}
                      search={{ q: search.q, category: search.category }}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      See all {config.plural.toLowerCase()} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                <ResourceGrid>
                  {group.items.map((r) => <ResourceCard key={r.id} resource={r} />)}
                </ResourceGrid>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
