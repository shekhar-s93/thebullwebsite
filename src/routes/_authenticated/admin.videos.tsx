import { createFileRoute } from "@tanstack/react-router";

import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/videos")({
  component: () => <ResourceManager type="video" />,
});
