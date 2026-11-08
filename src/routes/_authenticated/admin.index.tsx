import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { db } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

async function count(table: string, filter?: (q: any) => any) {
  let q = db.from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c, error } = await q;
  if (error) throw new Error(error.message);
  return c ?? 0;
}

function Dashboard() {
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const tables = ["videos", "sites", "applications"];
      const [totals, published, featured, categories, platforms] = await Promise.all([
        Promise.all(tables.map((t) => count(t))),
        Promise.all(tables.map((t) => count(t, (q) => q.eq("is_published", true)))),
        Promise.all(tables.map((t) => count(t, (q) => q.eq("is_featured", true)))),
        count("categories"),
        count("video_platforms"),
      ]);
      const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
      return {
        videos: totals[0],
        sites: totals[1],
        applications: totals[2],
        published: sum(published),
        drafts: sum(totals) - sum(published),
        featured: sum(featured),
        categories,
        platforms,
      };
    },
  });

  const cards = stats.data
    ? [
        ["Total Videos", stats.data.videos],
        ["Total Sites", stats.data.sites],
        ["Total Applications", stats.data.applications],
        ["Published Resources", stats.data.published],
        ["Draft Resources", stats.data.drafts],
        ["Featured Resources", stats.data.featured],
        ["Total Categories", stats.data.categories],
        ["Total Video Platforms", stats.data.platforms],
      ]
    : [];

  return (
    <div>
      <AdminPageHeader title="Dashboard" description="An overview of everything on TheBull." />
      {stats.isError && <p className="text-sm text-destructive">Could not load stats.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.isPending
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />)
          : cards.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 font-display text-4xl font-bold text-gradient-gold">{value}</p>
              </div>
            ))}
      </div>
    </div>
  );
}
