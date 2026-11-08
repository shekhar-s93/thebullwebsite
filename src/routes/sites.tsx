import { createFileRoute } from "@tanstack/react-router";

import { Directory } from "@/components/Directory";
import { parseDirectorySearch } from "@/lib/resources";

export const Route = createFileRoute("/sites")({
  validateSearch: parseDirectorySearch,
  head: () => ({
    meta: [
      { title: "Sites — TheBull" },
      { name: "description", content: "Discover useful, inspiring websites hand-picked by TheBull." },
      { property: "og:title", content: "Sites — TheBull" },
      { property: "og:description", content: "A curated directory of the best websites, organized by category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SitesPage,
});

function SitesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <Directory
      type="site"
      title="Sites"
      description="Websites worth bookmarking — tools, inspiration and knowledge hubs, curated and organized by category."
      search={search}
      onSearchChange={(next) => navigate({ search: next, replace: true })}
    />
  );
}
