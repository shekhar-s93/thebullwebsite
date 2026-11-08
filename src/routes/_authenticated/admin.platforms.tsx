import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ImagePicker, previewSrc } from "@/components/admin/ImagePicker";
import { Field, ToggleRow } from "@/components/admin/ResourceFormDialog";
import { SmartImage } from "@/components/SmartImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { db, useAdminPlatforms, useRefreshAll, type AdminPlatform } from "@/lib/admin";
import { EMPTY_IMAGE, type ImageValue } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/admin/platforms")({
  component: PlatformsPage,
});

function PlatformsPage() {
  const list = useAdminPlatforms();
  const refresh = useRefreshAll();
  const [editing, setEditing] = useState<AdminPlatform | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminPlatform | null>(null);

  const toggle = async (p: AdminPlatform, v: boolean) => {
    const { error } = await db.from("video_platforms").update({ is_active: v }).eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const onDelete = async () => {
    if (!deleting) return;
    const { error } = await db.from("video_platforms").delete().eq("id", deleting.id);
    if (error) return toast.error(error.message);
    toast.success("Platform deleted. Its videos are kept.");
    setDeleting(null);
    refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Manage Video Platforms"
        description="Platforms are for organizing and filtering. Any video link is allowed regardless of platform."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add platform</Button>}
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {(list.data ?? []).map((p) => (
          <li key={p.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <SmartImage src={p.logo_url} alt="" fit="contain" className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              <div className="mt-1 flex gap-1.5">
                {p.is_custom && <Badge variant="secondary">Custom name allowed</Badge>}
                {!p.is_active && <Badge variant="outline">Disabled</Badge>}
              </div>
            </div>
            <Switch checked={p.is_active} onCheckedChange={(v) => toggle(p, v)} aria-label="Active" />
            <Button size="icon" variant="outline" aria-label="Edit" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" aria-label="Delete" className="text-destructive" onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
      {open && <PlatformDialog platform={editing} onClose={() => setOpen(false)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this platform?"
        description={<>“{deleting?.name}” will be removed. Videos using it are kept without a platform.</>}
        onConfirm={onDelete}
      />
    </div>
  );
}

function PlatformDialog({ platform, onClose }: { platform: AdminPlatform | null; onClose: () => void }) {
  const refresh = useRefreshAll();
  const [name, setName] = useState(platform?.name ?? "");
  const [active, setActive] = useState(platform?.is_active ?? true);
  const [custom, setCustom] = useState(platform?.is_custom ?? false);
  const [logo, setLogo] = useState<ImageValue>({ ...EMPTY_IMAGE, originalUrl: platform?.logo_url ?? "" });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length > 60) return toast.error("Enter a name (up to 60 characters).");
    setSaving(true);
    const row = { name: name.trim(), is_active: active, is_custom: custom, logo_url: previewSrc(logo) };
    const { error } = platform ? await db.from("video_platforms").update(row).eq("id", platform.id) : await db.from("video_platforms").insert(row);
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "A platform with this name already exists." : error.message);
    toast.success("Platform saved");
    await refresh();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{platform ? "Edit platform" : "Add platform"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Platform name *" htmlFor="pname">
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </Field>
          <ImagePicker label="Platform icon or logo (image URL)" value={logo} onChange={setLogo} allowUpload={false} />
          <ToggleRow id="pactive" label="Active" hint="Available in forms and filters" checked={active} onChange={setActive} />
          <ToggleRow id="pcustom" label="Allow custom platform name" hint="Like “Other” — lets you type a name per video" checked={custom} onChange={setCustom} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
