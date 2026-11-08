import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type AuthSearch = { redirect?: string };

function safeRedirect(value: string | undefined): string {
  if (!value) return "/admin";
  try {
    const url = new URL(value, "http://local");
    const path = url.pathname + url.search;
    return path.startsWith("/admin") ? path : "/admin";
  } catch {
    return "/admin";
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Admin Login — TheBull" },
      { name: "description", content: "Sign in to manage TheBull's videos, sites and applications." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Login — TheBull" },
      { property: "og:description", content: "Administrator sign-in for TheBull." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(1, "Enter your password").max(200),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: safeRedirect(search.redirect) as "/admin", replace: true });
  }, [session, navigate, search.redirect]);

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid input");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) return setError(error.message === "Invalid login credentials" ? "Incorrect email or password." : error.message);
    toast.success("Welcome back");
  };

  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) return setError("Enter a valid email address");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    toast.success("If that account exists, a reset link is on its way.");
    setMode("login");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-hero px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-8 shadow-card sm:p-10">
        <div className="flex flex-col items-center text-center">
          <BrandLogo className="h-20 rounded-xl" />
          <h1 className="mt-6 text-2xl font-bold">{mode === "login" ? "Admin Login" : "Reset your password"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to manage TheBull's content."
              : "Enter your admin email and we'll send you a reset link."}
          </p>
        </div>

        <form onSubmit={mode === "login" ? onLogin : onForgot} className="mt-8 space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {mode === "login" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => { setMode("forgot"); setError(null); }}>
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {mode === "login" ? "Sign in" : "Send reset link"}
          </Button>
          {mode === "forgot" && (
            <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("login")}>
              Back to sign in
            </Button>
          )}
        </form>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Administrator access only. <Link to="/" className="text-primary hover:underline">Back to the website</Link>
        </p>
      </div>
    </div>
  );
}
