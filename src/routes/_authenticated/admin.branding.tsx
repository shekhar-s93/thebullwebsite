import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { DEFAULT_LOGO_URL } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { db, throwIf, useRefreshAll } from "@/lib/admin";
import { imageValueFrom, persistImage, removeImage, type ImageValue } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  component: BrandingPage,
});

interface SettingsRow {
  logo_mode: "default" | "url" | "upload" | "none";
  logo_original_url: string | null;
  logo_url: string | null;
  logo_path: string | null;
}

function BrandingPage() {
  const refresh = useRefreshAll();
  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await db.from("site_settings").select("*").eq("id", 1).single();
      throwIf(error);
      return data as SettingsRow;
    },
  });
  const [image, setImage] = useState<ImageValue | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.data && !image) {
      const s = settings.data;
      setImage(
        imageValueFrom({
          image_source: s.logo_mode === "upload" ? "upload" : "url",
          image_original_url: s.logo_mode === "url" ? s.logo_original_url : "",
          image_url: s.logo_mode === "upload" || s.logo_mode === "url" ? s.logo_url : null,
          image_path: s.logo_path,
        }),
      );
    }
  }, [settings.data, image]);

  const save = async (mode: "custom" | "default" | "none") => {
    if (!image || !settings.data) return;
    setSaving(true);
    try {
      const prevPath = settings.data.logo_path;
      let row: Partial<SettingsRow> = { logo_mode: mode === "none" ? "none" : "default", logo_url: null, logo_original_url: null, logo_path: null };
      if (mode === "custom") {
        const p = await persistImage(image, "branding");
        if (!p.image_url) throw new Error("Add a logo link or upload an image first.");
        row = { logo_mode: p.image_source ?? "url", logo_url: p.image_url, logo_original_url: p.image_original_url, logo_path: p.image_path };
      }
      const { error } = await db.from("site_settings").update(row).eq("id", 1);
      throwIf(error);
      if (prevPath && prevPath !== row.logo_path) await removeImage(prevPath);
      toast.success(mode === "default" ? "Default logo restored" : mode === "none" ? "Logo removed" : "Logo updated");
      setImage(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const current = settings.data;
  const currentLogo = !current ? null : current.logo_mode === "default" ? DEFAULT_LOGO_URL : current.logo_mode === "none" ? null : current.logo_url;

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="Website Branding" description="The logo updates everywhere: navbar, footer, login page and dashboard." />
      <div className="mb-8 flex items-center gap-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex h-24 min-w-24 items-center justify-center rounded-xl bg-background p-2">
          {currentLogo ? <img src={currentLogo} alt="Current logo" className="h-20 w-auto max-w-[200px] object-contain" referrerPolicy="no-referrer" /> : <span className="text-xs text-muted-foreground">No logo</span>}
        </div>
        <div>
          <p className="font-semibold">Current logo</p>
          <p className="text-sm text-muted-foreground">
            {current?.logo_mode === "default" ? "Official TheBull logo (default)" : current?.logo_mode === "none" ? "Logo hidden — site name shown instead" : "Custom logo"}
          </p>
        </div>
      </div>

      {image ? (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <ImagePicker label="New logo" value={image} onChange={setImage} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save("custom")} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save logo</Button>
            <Button variant="outline" onClick={() => save("default")} disabled={saving}><RotateCcw className="h-4 w-4" /> Restore default logo</Button>
            <Button variant="ghost" className="text-destructive" onClick={() => save("none")} disabled={saving}>Remove logo</Button>
          </div>
        </div>
      ) : (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      )}
    </div>
  );
}
