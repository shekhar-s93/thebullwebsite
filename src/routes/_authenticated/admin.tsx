import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  AppWindow,
  Clapperboard,
  Globe,
  LayoutDashboard,
  Layers,
  Loader2,
  LogOut,
  Menu,
  Palette,
  Settings,
  Tv,
  X,
} from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — TheBull" },
      { name: "description", content: "Manage TheBull's videos, sites, applications and branding." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Dashboard — TheBull" },
      { property: "og:description", content: "TheBull administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/videos", label: "Manage Videos", icon: Clapperboard },
  { to: "/admin/sites", label: "Manage Sites", icon: Globe },
  { to: "/admin/applications", label: "Manage Applications", icon: AppWindow },
  { to: "/admin/categories", label: "Manage Categories", icon: Layers },
  { to: "/admin/platforms", label: "Manage Video Platforms", icon: Tv },
  { to: "/admin/branding", label: "Website Branding", icon: Palette },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const role = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (error) throw error;
      return !!data;
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (role.isPending) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!role.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <BrandLogo className="h-16 rounded-xl" />
        <h1 className="text-2xl font-bold">Administrator access required</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          You're signed in as {user.email}, but this account isn't an administrator.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/">Back to website</Link></Button>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: "exact" in item }}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          activeProps={{ className: "bg-sidebar-accent !text-primary font-semibold", "aria-current": "page" }}
        >
          <item.icon className="h-4 w-4" /> {item.label}
        </Link>
      ))}
      <button onClick={signOut} className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-destructive">
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/" className="mb-6 px-2"><BrandLogo className="h-10 rounded-md" showName /></Link>
        {nav}
        <p className="mt-auto truncate px-3 text-xs text-muted-foreground">{user.email}</p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <Link to="/"><BrandLogo className="h-8 rounded" showName /></Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Toggle admin menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>
        {open && <div className="border-b border-border bg-sidebar p-4 lg:hidden">{nav}</div>}
        <main className={cn("flex-1 p-4 sm:p-6 lg:p-10")}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
