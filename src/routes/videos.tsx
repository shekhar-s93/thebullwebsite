import { createFileRoute } from "@tanstack/react-router";

import { Directory } from "@/components/Directory";
import { parseDirectorySearch } from "@/lib/resources";

export const Route = createFileRoute("/videos")({
  validateSearch: parseDirectorySearch,
  head: () => ({
    meta: [
      { title: "Videos — TheBull" },
      { name: "description", content: "Browse curated videos from YouTube, Vimeo, TikTok, Twitch and more on TheBull." },
      { property: "og:title", content: "Videos — TheBull" },
      { property: "og:description", content: "Curated videos from every platform, searchable by category and platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <Directory
      type="video"
      title="Videos"
      description="Hand-picked videos from every corner of the web. Filter by category or platform and jump straight to the source."
      search={search}
      onSearchChange={(next) => navigate({ search: next, replace: true })}
    />
  );
}
