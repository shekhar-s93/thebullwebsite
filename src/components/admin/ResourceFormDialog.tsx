import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ImagePicker } from "@/components/admin/ImagePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { db, throwIf, useAdminCategories, useAdminPlatforms, useRefreshAll } from "@/lib/admin";
import { isHttpUrl } from "@/lib/images";
import { APP_PLATFORMS, RESOURCE_CONFIG, type Resource, type ResourceType } from "@/lib/resources";
import { EMPTY_IMAGE, imageValueFrom, persistImage, removeImage, type ImageValue } from "@/lib/storage";

const NONE = "__none";

interface FormState {
  title: string;
  url: string;
  description: string;
  category_id: string;
  platform_id: string;
  custom_platform_name: string;
  app_platform: string;
  is_featured: boolean;
  is_published: boolean;
  image: ImageValue;
}

function initialState(resource: Resource | null): FormState {
  return {
    title: resource?.title ?? "",
    url: resource?.url ?? "",
    description: resource?.description ?? "",
    category_id: resource?.category_id ?? NONE,
    platform_id: resource?.platform_id ?? NONE,
    custom_platform_name: resource?.custom_platform_name ?? "",
    app_platform: resource?.app_platform ?? "Web",
    is_featured: resource?.is_featured ?? false,
    is_published: resource?.is_published ?? true,
    image: resource ? imageValueFrom(resource) : EMPTY_IMAGE,
  };
}

const schema = z.object({
  title: z.string().trim().min(1, "Name is required").max(200, "Keep the name under 200 characters"),
  url: z
    .string()
    .trim()
    .max(2000, "That link is too long")
    .refine(isHttpUrl, "Enter a valid link starting with http:// or https://"),
  description: z.string().trim().max(2000, "Keep the description under 2000 characters"),
  custom_platform_name: z.string().trim().max(60, "Keep the platform name under 60 characters"),
});

interface Props {
  type: ResourceType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
}

export function ResourceFormDialog({ type, open, onOpenChange, resource }: Props) {
  const config = RESOURCE_CONFIG[type];
  const [form, setForm] = useState<FormState>(() => initialState(resource));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const categories = useAdminCategories();
  const platforms = useAdminPlatforms();
  const refresh = useRefreshAll();

  useEffect(() => {
    if (open) {
      setForm(initialState(resource));
      setErrors({});
    }
  }, [open, resource]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const categoryOptions = (categories.data ?? []).filter(
    (c) => c.resource_type === type || c.resource_type === "all" || c.id === form.category_id,
  );
  const platformOptions = (platforms.data ?? []).filter((p) => p.is_active || p.id === form.platform_id);
  const selectedPlatform = platformOptions.find((p) => p.id === form.platform_id);
  const showCustomPlatform = type === "video" && !!selectedPlatform?.is_custom;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (next[String(i.path[0])] = i.message));
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const image = await persistImage(form.image, config.folder);
      const row: Record<string, unknown> = {
        title: parsed.data.title,
        url: parsed.data.url,
        description: parsed.data.description || null,
        category_id: form.category_id === NONE ? null : form.category_id,
        is_featured: form.is_featured,
        is_published: form.is_published,
        ...image,
      };
      if (type === "video") {
        row.platform_id = form.platform_id === NONE ? null : form.platform_id;
        row.custom_platform_name = showCustomPlatform ? parsed.data.custom_platform_name || null : null;
      }
      if (type === "application") row.app_platform = form.app_platform;

      const table = db.from(config.table);
      const { error } = resource ? await table.update(row).eq("id", resource.id) : await table.insert(row);
      if (error) {
        if (image.image_path && image.image_path !== resource?.image_path) await removeImage(image.image_path);
        throwIf(error);
      }
      if (resource?.image_path && resource.image_path !== image.image_path) await removeImage(resource.image_path);
      toast.success(resource ? `${config.label} updated` : `${config.label} added`);
      await refresh();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{resource ? `Edit ${config.label.toLowerCase()}` : `Add ${config.label.toLowerCase()}`}</DialogTitle>
          <DialogDescription>Fields marked * are required. Images are optional.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Field label={`${config.nameLabel} *`} error={errors.title} htmlFor="title">
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={200} />
          </Field>
          <Field
            label={`${config.urlLabel} *`}
            error={errors.url}
            htmlFor="url"
            hint={type === "video" ? "Any video link works — YouTube, Vimeo, TikTok, Instagram, your own site and more." : undefined}
          >
            <Input id="url" type="url" inputMode="url" placeholder="https://" value={form.url} onChange={(e) => set("url", e.target.value)} />
          </Field>

          {type === "video" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Video Platform" htmlFor="platform">
                <Select value={form.platform_id} onValueChange={(v) => set("platform_id", v)}>
                  <SelectTrigger id="platform"><SelectValue placeholder="Choose platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No platform</SelectItem>
                    {platformOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{!p.is_active ? " (disabled)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {showCustomPlatform && (
                <Field label="Custom platform name" htmlFor="customPlatform" error={errors.custom_platform_name}>
                  <Input
                    id="customPlatform"
                    placeholder="e.g. Rumble"
                    value={form.custom_platform_name}
                    onChange={(e) => set("custom_platform_name", e.target.value)}
                    maxLength={60}
                  />
                </Field>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="category">
              <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                <SelectTrigger id="category"><SelectValue placeholder="Choose category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Uncategorized</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{!c.is_active ? " (disabled)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {type === "application" && (
              <Field label="Supported Platform" htmlFor="appPlatform">
                <Select value={form.app_platform} onValueChange={(v) => set("app_platform", v)}>
                  <SelectTrigger id="appPlatform"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APP_PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <Field label="Description" htmlFor="description" error={errors.description}>
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} />
          </Field>

          <ImagePicker
            label="Image Source"
            value={form.image}
            onChange={(v) => set("image", v)}
            previewFit={type === "video" ? "cover" : "contain"}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleRow id="featured" label="Featured" hint="Highlight on the homepage" checked={form.is_featured} onChange={(v) => set("is_featured", v)} />
            <ToggleRow id="published" label="Published" hint="Visible to visitors" checked={form.is_published} onChange={(v) => set("is_published", v)} />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

export function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
