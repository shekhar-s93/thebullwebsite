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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { db, useAdminCategories, useRefreshAll, type AdminCategory } from "@/lib/admin";
import { EMPTY_IMAGE, imageValueFrom, uploadImage, type ImageValue } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesPage,
});

const TYPE_LABEL = { video: "Videos", site: "Sites", application: "Applications", all: "All types" } as const;

function CategoriesPage() {
  const list = useAdminCategories();
  const refresh = useRefreshAll();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);

  const toggleActive = async (c: AdminCategory, v: boolean) => {
    const { error } = await db.from("categories").update({ is_active: v }).eq("id", c.id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const onDelete = async () => {
    if (!deleting) return;
    const { error } = await db.from("categories").delete().eq("id", deleting.id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted. Its items are now uncategorized.");
    setDeleting(null);
    refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title="Manage Categories"
        description="Categories appear in filters, forms and the homepage."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add category</Button>}
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {(list.data ?? []).map((c) => (
          <li key={c.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <SmartImage src={c.image_url} alt="" fit="contain" className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{TYPE_LABEL[c.resource_type]}</Badge>
                {!c.is_active && <Badge variant="outline">Disabled</Badge>}
              </div>
            </div>
            <Switch checked={c.is_active} onCheckedChange={(v) => toggleActive(c, v)} aria-label="Active" />
            <Button size="icon" variant="outline" aria-label="Edit" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" aria-label="Delete" className="text-destructive" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
      {open && <CategoryDialog category={editing} onClose={() => setOpen(false)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this category?"
        description={<>“{deleting?.name}” will be removed. Videos, sites and applications in it are kept and become uncategorized.</>}
        onConfirm={onDelete}
      />
    </div>
  );
}

function CategoryDialog({ category, onClose }: { category: AdminCategory | null; onClose: () => void }) {
  const refresh = useRefreshAll();
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [type, setType] = useState<string>(category?.resource_type ?? "video");
  const [active, setActive] = useState(category?.is_active ?? true);
  const [image, setImage] = useState<ImageValue>(category?.image_url ? imageValueFrom({ image_source: "url", image_url: category.image_url }) : EMPTY_IMAGE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length > 80) return setError("Enter a name (up to 80 characters).");
    setSaving(true);
    try {
      let image_url = image.source === "upload" ? image.uploadedUrl : previewSrc(image);
      if (image.source === "upload" && image.file) image_url = (await uploadImage(image.file, "categories")).url;
      const row = { name: name.trim(), description: description.trim().slice(0, 500) || null, resource_type: type, is_active: active, image_url };
      const { error } = category ? await db.from("categories").update(row).eq("id", category.id) : await db.from("categories").insert(row);
      if (error) throw new Error(error.message);
      toast.success("Category saved");
      await refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Category name *" htmlFor="cname" error={error ?? undefined}>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </Field>
          <Field label="Used for" htmlFor="ctype">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="ctype"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="site">Sites</SelectItem>
                <SelectItem value="application">Applications</SelectItem>
                <SelectItem value="all">All types</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" htmlFor="cdesc">
            <Textarea id="cdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </Field>
          <ImagePicker label="Icon or image (optional)" value={image} onChange={setImage} />
          <ToggleRow id="cactive" label="Active" hint="Show in public filters" checked={active} onChange={setActive} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
