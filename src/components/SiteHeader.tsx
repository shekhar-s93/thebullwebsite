import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogIn, Menu, Search, X } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", exact: true },
  { to: "/videos", label: "Videos" },
  { to: "/sites", label: "Sites" },
  { to: "/applications", label: "Applications" },
  { to: "/search", label: "Search" },
] as const;

const linkBase =
  "relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
const linkActive = "text-foreground bg-secondary";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center" aria-label="TheBull home" onClick={() => setOpen(false)}>
          <BrandLogo className="h-10 rounded-md" showName nameClassName="hidden sm:inline" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: "exact" in item }}
              className={linkBase}
              activeProps={{ className: linkActive, "aria-current": "page" }}
            >
              {item.to === "/search" && <Search className="mr-1.5 inline h-4 w-4" aria-hidden="true" />}
              {item.label}
            </Link>
          ))}
        </nav>
      
        {/*
          <div className="hidden md:block">
            {session ? (
              <Button asChild size="sm" className="rounded-full">
                <Link to="/admin">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/auth">
                  <LogIn className="h-4 w-4" /> Admin Login
                </Link>
              </Button>
            )}
          </div>
        */}

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <nav className="border-t border-border/60 bg-background px-4 pb-4 pt-2 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: "exact" in item }}
                onClick={() => setOpen(false)}
                className={cn(linkBase, "rounded-lg px-3 py-3 text-base")}
                activeProps={{ className: cn(linkActive, "text-primary"), "aria-current": "page" }}
              >
                {item.label}
              </Link>
            ))}
            {/*
              <Link
                to={session ? "/admin" : "/auth"}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg bg-primary px-3 py-3 text-center text-base font-semibold text-primary-foreground"
              >
                {session ? "Dashboard" : "Admin Login"}
              </Link>
              */}
          </div>
        </nav>
      )}
    </header>
  );
}
