import { createFileRoute } from "@tanstack/react-router";

// Serves uploaded images to every visitor. Only exact file paths inside the
// image folders are readable; nothing can be listed, written or deleted here.
const SAFE_PATH = /^(videos|sites|applications|branding|categories|platforms)\/[a-zA-Z0-9-]{8,64}\.(jpg|jpeg|png|webp|gif)$/;

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!SAFE_PATH.test(path)) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
