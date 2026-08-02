"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CloudOff, Gift, Loader2, RefreshCw, WifiOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatGHS } from "@/lib/format";
import { brDeviceInfo, brLookupMember, brRedeem, flushQueue, queuedCount, type DeviceInfo } from "@/lib/db-br-pos";

export default function BrPosPage() {
  return (
    <Suspense fallback={null}>
      <Pos />
    </Suspense>
  );
}

type Stage = "phone" | "amount" | "result";
type Outcome =
  | { kind: "success"; memberName: string | null; amountDue: number; customerSaving: number; commission: number }
  | { kind: "queued" }
  | null;

function Pos() {
  const token = useSearchParams().get("t") ?? "";
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [memberName, setMemberName] = useState<string | null>(null);
  const [offlineEntry, setOfflineEntry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [queued, setQueued] = useState(0);
  const [online, setOnline] = useState(true);
  const [device, setDevice] = useState<{ status: "loading" | "ready"; info: DeviceInfo }>({
    status: "loading",
    info: null,
  });

  // Confirm the token resolves to a partner on load (so staff see which business this device is for).
  useEffect(() => {
    if (!token) return;
    let active = true;
    brDeviceInfo(token).then((info) => {
      if (active) setDevice({ status: "ready", info });
    });
    return () => {
      active = false;
    };
  }, [token]);

  const sync = useCallback(async () => {
    await flushQueue();
    setQueued(queuedCount());
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    setQueued(queuedCount());
    void sync();
    const goOnline = () => {
      setOnline(true);
      void sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [sync]);

  function reset() {
    setStage("phone");
    setPhone("");
    setAmount("");
    setMemberName(null);
    setOfflineEntry(false);
    setError(null);
    setOutcome(null);
  }

  async function checkPhone() {
    if (busy) return;
    setError(null);
    if (!navigator.onLine) {
      // Can't verify offline — proceed and let the sync reconcile membership.
      setOfflineEntry(true);
      setMemberName(null);
      setStage("amount");
      return;
    }
    setBusy(true);
    const res = await brLookupMember(token, phone);
    setBusy(false);
    if (!res.ok) return setError(res.message);
    if (!res.found) return setError("Not a member — no Bucket Rewards discount for this number.");
    setMemberName(res.name);
    setOfflineEntry(false);
    setStage("amount");
  }

  async function applyDiscount() {
    if (busy) return;
    const value = Number(amount);
    if (!value || value <= 0) return setError("Enter an amount greater than zero.");
    setBusy(true);
    setError(null);
    const res = await brRedeem(token, phone, value);
    setBusy(false);
    setQueued(queuedCount());
    if (res.ok) {
      setOutcome({
        kind: "success",
        memberName: res.memberName,
        amountDue: res.amountDue,
        customerSaving: res.customerSaving,
        commission: res.commission,
      });
      setStage("result");
    } else if (res.queued) {
      setOutcome({ kind: "queued" });
      setStage("result");
    } else {
      setError(res.message);
    }
  }

  if (!token) {
    return (
      <Shell online={online} queued={queued} onSync={sync}>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <XCircle className="size-10 text-destructive" />
          <p className="font-heading text-lg font-semibold text-foreground">Device not set up</p>
          <p className="text-sm text-muted-foreground">
            This link is missing its device code. Ask GH Bucketlist for your Bucket Rewards device link.
          </p>
        </div>
      </Shell>
    );
  }

  // A valid token that resolves to no partner (while online) is an unknown device; an inactive
  // partner is paused. Offline we can't confirm, so we let the flow proceed and reconcile on sync.
  const invalidDevice = device.status === "ready" && !device.info && online;
  const inactiveDevice = !!device.info && !device.info.active;
  if (invalidDevice || inactiveDevice) {
    return (
      <Shell online={online} queued={queued} onSync={sync}>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <XCircle className="size-10 text-destructive" />
          <p className="font-heading text-lg font-semibold text-foreground">
            {inactiveDevice ? "This partner is paused" : "Device not recognised"}
          </p>
          <p className="text-sm text-muted-foreground">
            {inactiveDevice
              ? "Bucket Rewards is paused for this business. Contact GH Bucketlist to reactivate."
              : "This link isn't recognised. Ask GH Bucketlist for your Bucket Rewards device link."}
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell online={online} queued={queued} onSync={sync} partnerName={device.info?.name ?? null}>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {stage === "phone" && (
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="pos-phone" className="text-base">Customer phone number</Label>
            <Input
              id="pos-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="024 000 0000"
              className="mt-2 h-14 text-lg"
              autoFocus
            />
          </div>
          <Button size="lg" className="h-14 gap-2 text-base" disabled={phone.trim().length < 7 || busy} onClick={checkPhone}>
            {busy && <Loader2 className="size-5 animate-spin" />}
            Continue
          </Button>
        </div>
      )}

      {stage === "amount" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-secondary/50 px-4 py-3 text-sm">
            {offlineEntry ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <WifiOff className="size-4" /> Offline — membership will be checked when this syncs.
              </span>
            ) : (
              <span className="text-foreground">
                Member: <span className="font-semibold">{memberName || phone}</span>
              </span>
            )}
          </div>
          <div>
            <Label htmlFor="pos-amount" className="text-base">Bill amount (GHS)</Label>
            <Input
              id="pos-amount"
              type="number"
              inputMode="decimal"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-2 h-14 text-lg"
              autoFocus
            />
          </div>
          <Button size="lg" className="h-14 gap-2 text-base" disabled={busy} onClick={applyDiscount}>
            {busy && <Loader2 className="size-5 animate-spin" />}
            Apply Bucket Rewards discount
          </Button>
          <Button variant="ghost" onClick={reset}>Cancel</Button>
        </div>
      )}

      {stage === "result" && outcome?.kind === "success" && (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <CheckCircle2 className="size-12 text-success" />
          <p className="font-heading text-lg font-semibold text-foreground">Discount applied</p>
          <div className="w-full rounded-2xl border border-border p-4 text-left">
            <Row label="Customer pays" value={formatGHS(outcome.amountDue)} strong />
            <Row label="They saved" value={formatGHS(outcome.customerSaving)} success />
            <Row label="Commission logged" value={formatGHS(outcome.commission)} muted />
          </div>
          <Button size="lg" className="h-14 w-full text-base" onClick={reset}>New sale</Button>
        </div>
      )}

      {stage === "result" && outcome?.kind === "queued" && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <CloudOff className="size-12 text-brand-coral" />
          <p className="font-heading text-lg font-semibold text-foreground">Saved offline</p>
          <p className="text-sm text-muted-foreground">
            This redemption is stored on the device and will sync automatically when the internet returns.
          </p>
          <Button size="lg" className="h-14 w-full text-base" onClick={reset}>New sale</Button>
        </div>
      )}
    </Shell>
  );
}

function Shell({
  children,
  online,
  queued,
  onSync,
  partnerName,
}: {
  children: React.ReactNode;
  online: boolean;
  queued: number;
  onSync: () => void;
  partnerName?: string | null;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="flex flex-col">
          <span className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
            <Gift className="size-5 text-primary" /> Bucket Rewards
          </span>
          {partnerName && <span className="mt-0.5 pl-7 text-xs text-muted-foreground">{partnerName}</span>}
        </span>
        <div className="flex items-center gap-2 text-xs">
          {!online && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground">
              <WifiOff className="size-3.5" /> Offline
            </span>
          )}
          {queued > 0 && (
            <button onClick={onSync} className="flex items-center gap-1 rounded-full bg-brand-coral/10 px-2 py-1 text-brand-coral">
              <RefreshCw className="size-3.5" /> {queued} to sync
            </button>
          )}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Row({ label, value, strong, success, muted }: { label: string; value: string; strong?: boolean; success?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-heading text-lg font-bold text-foreground" : success ? "font-medium text-success" : muted ? "text-muted-foreground" : "text-foreground"}>
        {value}
      </span>
    </div>
  );
}
