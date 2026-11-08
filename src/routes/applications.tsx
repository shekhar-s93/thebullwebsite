import { createFileRoute } from "@tanstack/react-router";

import { Directory } from "@/components/Directory";
import { parseDirectorySearch } from "@/lib/resources";

export const Route = createFileRoute("/applications")({
  validateSearch: parseDirectorySearch,
  head: () => ({
    meta: [
      { title: "Applications — TheBull" },
      {
        name: "description",
        content: "Find great applications for Windows, macOS, Linux, Android, iOS and the web on TheBull.",
      },
      { property: "og:title", content: "Applications — TheBull" },
      { property: "og:description", content: "Curated apps for every platform, filterable by category and device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <Directory
      type="application"
      title="Applications"
      description="Apps for desktop, mobile and the web. Filter by the platform you use and get straight to the download."
      search={search}
      onSearchChange={(next) => navigate({ search: next, replace: true })}
    />
  );
}
