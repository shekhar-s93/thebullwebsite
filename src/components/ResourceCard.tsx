import { ArrowUpRight, Star } from "lucide-react";

import { SmartImage } from "@/components/SmartImage";
import { Badge } from "@/components/ui/badge";
import { platformLabel, RESOURCE_CONFIG, type Resource } from "@/lib/resources";
import { cn } from "@/lib/utils";

export function ResourceCard({ resource, showType = false }: { resource: Resource; showType?: boolean }) {
  const config = RESOURCE_CONFIG[resource.type];
  const platform = platformLabel(resource);
  const isSquareArt = resource.type !== "video";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow">
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        aria-label={`${config.cta}: ${resource.title}`}
        tabIndex={-1}
      >
        <SmartImage
          src={resource.image_url}
          alt={resource.title}
          fit={isSquareArt ? "contain" : "cover"}
          className={cn("aspect-video w-full", isSquareArt && "bg-surface p-4")}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </a>
      {resource.is_featured && (
        <Badge className="absolute left-3 top-3 gap-1 rounded-full bg-gradient-gold text-primary-foreground shadow-glow">
          <Star className="h-3 w-3 fill-current" aria-hidden="true" /> Featured
        </Badge>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {showType && (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 font-medium text-primary">{config.label}</span>
          )}
          <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
            {resource.category?.name ?? "Uncategorized"}
          </span>
          {platform && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-muted-foreground">
              {resource.platform?.logo_url && (
                <img src={resource.platform.logo_url} alt="" className="h-3.5 w-3.5 object-contain" loading="lazy" referrerPolicy="no-referrer" />
              )}
              {platform}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug">{resource.title}</h3>
        {resource.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
        )}
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {config.cta} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export function ResourceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="aspect-video animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function ResourceGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>{children}</div>;
}
