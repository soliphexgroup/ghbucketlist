"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/profile";

export function SignupForm() {
  const router = useRouter();
  const requestedRole = useSearchParams().get("role");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(requestedRole === "host" ? "host" : "customer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (!data.session) {
      // Email confirmation is required before a session is issued.
      setNeedsEmailConfirmation(true);
      setSubmitting(false);
      return;
    }

    router.push(role === "host" ? "/dashboard/host" : "/");
    router.refresh();
  }

  if (needsEmailConfirmation) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-4 py-8 text-center">
        <MailCheck className="size-8 text-primary" />
        <p className="font-heading text-base font-semibold text-foreground">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to {email}. Follow it to activate your account.
        </p>
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
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          required
          placeholder="Jane Doe"
          className="mt-1.5"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          placeholder="you@email.com"
          className="mt-1.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
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
        <Label className="text-sm">I want to…</Label>
        <RadioGroup
          value={role}
          onValueChange={(v) => setRole(v as UserRole)}
          className="mt-2 flex flex-col gap-2"
        >
          <label className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent">
            <RadioGroupItem value="customer" />
            Explore experiences
          </label>
          <label className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent">
            <RadioGroupItem value="host" />
            Host experiences
          </label>
        </RadioGroup>
      </div>

      <Button type="submit" className="mt-2 w-full gap-2" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Create account
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
