import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppWindow, ArrowRight, Clapperboard, Globe, Layers } from "lucide-react";
import { useState, type FormEvent } from "react";

import { BrandLogo, useBranding } from "@/components/BrandLogo";
import { ResourceCard, ResourceGrid } from "@/components/ResourceCard";
import { SearchField } from "@/components/SearchField";
import { SmartImage } from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { homeQuery } from "@/lib/queries";
import { RESOURCE_CONFIG, type Resource, type ResourceType } from "@/lib/resources";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TheBull" },
      {
        name: "description",
        content:
          "Browse hand-picked videos, websites and applications on TheBull. Search, filter and discover the best of the web in one place.",
      },
      { property: "og:title", content: "TheBull — Discover Videos, Websites & Applications" },
      {
        property: "og:description",
        content: "Hand-picked videos, websites and applications, organized so you can find what matters fast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: HomePage,
});

function HomePage() {
  const { data } = useSuspenseQuery(homeQuery);
  const branding = useBranding();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { q: q.trim() || undefined } });
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-hero">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-20 lg:pb-28">
          <BrandLogo className="h-28 rounded-2xl sm:h-36" />
          <h1 className="mt-8 text-4xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
            <span className="text-gradient-gold">{branding.tagline}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">{branding.site_description}</p>
          <form onSubmit={onSearch} className="mt-10 flex w-full max-w-2xl flex-col gap-3 sm:flex-row" role="search">
            <SearchField value={q} onChange={setQ} placeholder="Search videos, sites and apps…" size="lg" className="flex-1" />
            <Button type="submit" size="lg" className="h-14 rounded-xl px-8 text-base shadow-glow">
              Search
            </Button>
          </form>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="secondary" size="lg" className="rounded-full">
              <Link to="/videos"><Clapperboard className="h-4 w-4" /> Browse Videos</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="rounded-full">
              <Link to="/sites"><Globe className="h-4 w-4" /> Explore Sites</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="rounded-full">
              <Link to="/applications"><AppWindow className="h-4 w-4" /> Explore Applications</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 pt-16 sm:px-6 lg:px-8">
        <FeaturedSection type="video" items={data.featured.video} />
        <FeaturedSection type="site" items={data.featured.site} />
        <FeaturedSection type="application" items={data.featured.application} />

        {data.recent.length > 0 && (
          <section aria-labelledby="recent-heading">
            <SectionHeader id="recent-heading" eyebrow="Fresh picks" title="Recently Added Resources" />
            <ResourceGrid>
              {data.recent.map((r) => (
                <ResourceCard key={`${r.type}-${r.id}`} resource={r} showType />
              ))}
            </ResourceGrid>
          </section>
        )}

        {data.categories.length > 0 && (
          <section aria-labelledby="categories-heading">
            <SectionHeader id="categories-heading" eyebrow="Browse by topic" title="Popular Categories" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.categories.map((c) => {
                const target: ResourceType = c.resource_type === "all" ? "video" : c.resource_type;
                return (
                  <Link
                    key={c.id}
                    to={RESOURCE_CONFIG[target].path}
                    search={{ category: c.id }}
                    className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <SmartImage
                      src={c.image_url}
                      alt=""
                      fit="contain"
                      className="h-12 w-12 shrink-0 rounded-xl"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                          <Layers className="h-5 w-5" />
                        </div>
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.count} {c.count === 1 ? "resource" : "resources"} ·{" "}
                        {c.resource_type === "all" ? "All types" : RESOURCE_CONFIG[c.resource_type].plural}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function SectionHeader({ id, eyebrow, title, link }: { id: string; eyebrow: string; title: string; link?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 id={id} className="text-3xl font-bold sm:text-4xl">{title}</h2>
      </div>
      {link}
    </div>
  );
}

function FeaturedSection({ type, items }: { type: ResourceType; items: Resource[] }) {
  const config = RESOURCE_CONFIG[type];
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={`featured-${type}`}>
      <SectionHeader
        id={`featured-${type}`}
        eyebrow="Featured"
        title={`Featured ${config.plural}`}
        link={
          <Link to={config.path} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            View all {config.plural.toLowerCase()} <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <ResourceGrid>
        {items.slice(0, 4).map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </ResourceGrid>
    </section>
  );
}
