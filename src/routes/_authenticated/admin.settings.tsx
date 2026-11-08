import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Field } from "@/components/admin/ResourceFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { db, throwIf, useRefreshAll } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const refresh = useRefreshAll();
  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data, error } = await db.from("site_settings").select("*").eq("id", 1).single();
      throwIf(error);
      return data as { site_name: string; tagline: string; site_description: string };
    },
  });
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [desc, setDesc] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");

  useEffect(() => {
    if (settings.data) {
      setName(settings.data.site_name);
      setTagline(settings.data.tagline);
      setDesc(settings.data.site_description);
    }
  }, [settings.data]);

  const saveSite = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.length > 60) return toast.error("Site name must be 1–60 characters.");
    const { error } = await db
      .from("site_settings")
      .update({ site_name: name.trim(), tagline: tagline.trim().slice(0, 160), site_description: desc.trim().slice(0, 600) })
      .eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    refresh();
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast.error("New password must be at least 8 characters.");
    const check = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: current });
    if (check.error) return toast.error("Current password is incorrect.");
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return toast.error(error.message);
    setCurrent("");
    setNext("");
    toast.success("Password changed");
  };

  return (
    <div className="max-w-2xl space-y-10">
      <AdminPageHeader title="Settings" description="Website text and your admin account." />
      <form onSubmit={saveSite} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Website</h2>
        <Field label="Site name" htmlFor="sname"><Input id="sname" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Field>
        <Field label="Homepage heading" htmlFor="stag"><Input id="stag" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={160} /></Field>
        <Field label="Website description" htmlFor="sdesc"><Textarea id="sdesc" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={600} /></Field>
        <Button type="submit">Save settings</Button>
      </form>
      <form onSubmit={changePassword} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
        <Field label="Current password" htmlFor="cur"><Input id="cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
        <Field label="New password" htmlFor="new"><Input id="new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
        <Button type="submit">Update password</Button>
      </form>
    </div>
  );
}
