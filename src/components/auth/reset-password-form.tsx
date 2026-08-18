"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Status = "verifying" | "ready" | "invalid" | "done";

export function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>("verifying");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // If the recovery link was invalid/expired, Supabase redirects back here
    // with the error in the URL hash (e.g. #error=access_denied&error_code=otp_expired).
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hashError = hashParams.get("error_description") ?? hashParams.get("error");
    if (hashError) {
      // One-time read of the error carried back in the URL hash (client-only, no SSR equivalent),
      // so the synchronous setState on mount is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
      setStatus("invalid");
      return;
    }

    let settled = false;

    // The @supabase/ssr browser client detects the recovery token in the URL and
    // establishes a temporary session, firing PASSWORD_RECOVERY when it's ready.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        settled = true;
        setStatus("ready");
      }
    });

    // In case the session was already established before the listener attached.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        settled = true;
        setStatus("ready");
      }
    });

    // If no recovery session ever materializes, the link is missing or invalid.
    const timeout = setTimeout(() => {
      if (!settled) setStatus("invalid");
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setStatus("done");
    setSubmitting(false);
  }

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-4 py-8 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-8 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="font-heading text-base font-semibold text-foreground">
          This reset link is invalid or has expired
        </p>
        <p className="text-sm text-muted-foreground">
          {error ?? "Reset links can only be used once and expire after a while."} Request a fresh
          one and open it right away.
        </p>
        <Button asChild className="mt-2">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-4 py-8 text-center">
        <CheckCircle2 className="size-8 text-primary" />
        <p className="font-heading text-base font-semibold text-foreground">Password updated</p>
        <p className="text-sm text-muted-foreground">
          Your password has been changed. You can now log in with it.
        </p>
        <Button asChild className="mt-2">
          <Link href="/login">Go to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          placeholder="••••••••"
          className="mt-1.5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          type="password"
          required
          minLength={6}
          placeholder="••••••••"
          className="mt-1.5"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button type="submit" className="mt-2 w-full gap-2" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
