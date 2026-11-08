import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a New Password — TheBull" },
      { name: "description", content: "Choose a new password for your TheBull admin account." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Set a New Password — TheBull" },
      { property: "og:description", content: "Reset your TheBull admin password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && isRecovery) setReady(true);
      if (session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    toast.success("Password updated");
    navigate({ to: "/admin" });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-8 shadow-card sm:p-10">
        <div className="flex flex-col items-center text-center">
          <BrandLogo className="h-16 rounded-xl" />
          <h1 className="mt-6 text-2xl font-bold">Set a new password</h1>
        </div>
        {!ready ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Open this page from the reset link in your email. If the link expired, request a new one from the login page.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirm password</Label>
              <Input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
