"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { submitHostApplication, useMyHostApplication } from "@/lib/db-host-applications";

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">{children}</div>;
}

export function HostApplicationPanel() {
  const { user, profile, loading } = useAuth();
  const { application, loaded } = useMyHostApplication();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <Panel>
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Loading…
        </div>
      </Panel>
    );
  }

  // Signed out — ask them to create an account / sign in first.
  if (!user) {
    return (
      <Panel>
        <h2 className="font-heading text-lg font-semibold text-foreground">Apply to become a host</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an account (or sign in), then submit a short application. Our team reviews each one
          before your host dashboard is unlocked.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/signup?next=/hosting">Create an account</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/login?next=/hosting">Sign in</Link>
          </Button>
        </div>
      </Panel>
    );
  }

  // Already a host (or admin).
  if (profile?.role === "host" || profile?.role === "admin") {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="size-8 text-success" />
          <p className="font-heading text-base font-semibold text-foreground">You&apos;re already a host</p>
          <p className="text-sm text-muted-foreground">Head to your dashboard to manage listings and bookings.</p>
          <Button asChild className="mt-2">
            <Link href="/dashboard/host">Go to host dashboard</Link>
          </Button>
        </div>
      </Panel>
    );
  }

  if (!loaded) {
    return (
      <Panel>
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Checking your application…
        </div>
      </Panel>
    );
  }

  // Pending application (either just submitted, or found on load).
  if (submitted || application?.status === "pending") {
    return (
      <Panel>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Clock className="size-8 text-brand-coral" />
          <p className="font-heading text-base font-semibold text-foreground">Application under review</p>
          <p className="text-sm text-muted-foreground">
            Thanks! Our team is reviewing your application. You&apos;ll get host access as soon as it&apos;s
            approved — no need to apply again.
          </p>
        </div>
      </Panel>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await submitHostApplication({
      fullName: (fullName || profile?.full_name || "").trim(),
      email: (email || user?.email || "").trim(),
      interest: interest.trim(),
      phone: phone.trim(),
      message: message.trim(),
    });
    if (!res.ok) {
      setSubmitting(false);
      setError(res.message);
      return;
    }
    setSubmitting(false);
    setSubmitted(true);
  }

  const canSubmit = interest.trim().length > 1 && phone.trim().length > 3;

  return (
    <Panel>
      <h2 className="font-heading text-lg font-semibold text-foreground">Apply to become a host</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us what you&apos;d like to offer. Our team reviews each application before unlocking your
        host dashboard.
      </p>

      {application?.status === "declined" && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>Your previous application wasn&apos;t approved. You&apos;re welcome to apply again below.</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ha-name">Full name</Label>
            <Input id="ha-name" value={fullName || profile?.full_name || ""} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="ha-phone">Phone</Label>
            <Input id="ha-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="024 000 0000" className="mt-1.5" />
          </div>
        </div>
        <div>
          <Label htmlFor="ha-email">Contact email</Label>
          <Input
            id="ha-email"
            type="email"
            value={email || user.email || ""}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="ha-interest">What do you want to host?</Label>
          <Input
            id="ha-interest"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g. Stays, car rentals, cooking classes, handyman services"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="ha-message">Anything else? (optional)</Label>
          <Textarea
            id="ha-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us a bit about your business or experience."
            rows={3}
            className="mt-1.5"
          />
        </div>
        <Button type="submit" className="mt-1 w-full gap-2 sm:w-fit" disabled={!canSubmit || submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Submit application
        </Button>
      </form>
    </Panel>
  );
}
