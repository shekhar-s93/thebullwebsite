import { ExternalLink, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ResourceFormDialog } from "@/components/admin/ResourceFormDialog";
import { SearchField } from "@/components/SearchField";
import { SmartImage } from "@/components/SmartImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { db, useAdminCategories, useAdminResources, useRefreshAll } from "@/lib/admin";
import { platformLabel, RESOURCE_CONFIG, type Resource, type ResourceType } from "@/lib/resources";
import { removeImage } from "@/lib/storage";

const ALL = "__all";

export function ResourceManager({ type }: { type: ResourceType }) {
  const config = RESOURCE_CONFIG[type];
  const list = useAdminResources(type);
  const categories = useAdminCategories();
  const refresh = useRefreshAll();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Resource | null>(null);

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (list.data ?? []).filter((r) => {
      if (term && ![r.title, r.description ?? "", r.category?.name ?? ""].some((s) => s.toLowerCase().includes(term))) return false;
      if (category !== ALL && (category === "none" ? r.category_id : r.category_id !== category)) return false;
      if (status === "published" && !r.is_published) return false;
      if (status === "draft" && r.is_published) return false;
      if (status === "featured" && !r.is_featured) return false;
      return true;
    });
  }, [list.data, q, category, status]);

  const toggle = async (r: Resource, field: "is_published" | "is_featured", value: boolean) => {
    const { error } = await db.from(config.table).update({ [field]: value }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(field === "is_published" ? (value ? "Published" : "Unpublished") : value ? "Featured" : "Unfeatured");
    refresh();
  };

  const onDelete = async () => {
    if (!deleting) return;
    const { error } = await db.from(config.table).delete().eq("id", deleting.id);
    if (error) return toast.error(error.message);
    await removeImage(deleting.image_path);
    toast.success(`${config.label} deleted`);
    setDeleting(null);
    refresh();
  };

  return (
    <div>
      <AdminPageHeader
        title={`Manage ${config.plural}`}
        description={`${list.data?.length ?? 0} total`}
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Add {config.label.toLowerCase()}
          </Button>
        }
      />
      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_200px_180px]">
        <SearchField value={q} onChange={setQ} placeholder={`Search ${config.plural.toLowerCase()}…`} />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            <SelectItem value="none">Uncategorized</SelectItem>
            {(categories.data ?? [])
              .filter((c) => c.resource_type === type || c.resource_type === "all")
              .map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.isError ? (
        <p className="text-sm text-destructive">Could not load: {list.error.message}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
              <SmartImage src={r.image_url} alt="" fit="contain" className="aspect-video w-full shrink-0 rounded-lg sm:w-32" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{r.title}</p>
                  {!r.is_published && <Badge variant="secondary">Draft</Badge>}
                  {r.is_featured && <Badge className="gap-1"><Star className="h-3 w-3 fill-current" />Featured</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.category?.name ?? "Uncategorized"}
                  {platformLabel(r) ? ` · ${platformLabel(r)}` : ""} · {new Date(r.created_at).toLocaleDateString()}
                </p>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{r.url}</span>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={r.is_published} onCheckedChange={(v) => toggle(r, "is_published", v)} aria-label="Published" /> Published
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={r.is_featured} onCheckedChange={(v) => toggle(r, "is_featured", v)} aria-label="Featured" /> Featured
                </label>
                <Button size="icon" variant="outline" aria-label="Edit" onClick={() => { setEditing(r); setFormOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" aria-label="Delete" className="text-destructive" onClick={() => setDeleting(r)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ResourceFormDialog type={type} open={formOpen} onOpenChange={setFormOpen} resource={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete this ${config.label.toLowerCase()}?`}
        description={<>“{deleting?.title}” will be permanently removed.</>}
        onConfirm={onDelete}
      />
    </div>
  );
}
