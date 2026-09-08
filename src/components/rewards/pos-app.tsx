"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronDown, CloudOff, Gift, Loader2, Lock, RefreshCw, WifiOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatGHS } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  brDeviceInfo,
  brLookupMember,
  brPartnerStats,
  brRedeem,
  flushQueue,
  memberStatusOffline,
  queuedCount,
  refreshMemberDigest,
  type DeviceInfo,
  type PartnerStats,
  type Provisional,
  type StatsPeriod,
} from "@/lib/db-br-pos";
import { PosPwa } from "@/components/rewards/pos-pwa";

const TOKEN_KEY = "br:device-token";

export function PosApp() {
  return (
    <Suspense fallback={null}>
      <Pos />
    </Suspense>
  );
}

type Stage = "phone" | "amount" | "result";
type Outcome =
  | { kind: "success"; memberName: string | null; amountDue: number; customerSaving: number; commission: number }
  | { kind: "queued"; provisional?: Provisional }
  | null;

function Pos() {
  // The token comes from the ?t= link, but we remember it so an installed home-screen shortcut
  // (which opens /rewards/pos with no query) still knows which partner this device is for.
  const urlToken = useSearchParams().get("t") ?? "";
  const [token, setToken] = useState(urlToken);
  const [tokenReady, setTokenReady] = useState(Boolean(urlToken));
  useEffect(() => {
    try {
      if (urlToken) {
        window.localStorage.setItem(TOKEN_KEY, urlToken);
        // One-time reconcile of the token against the ?t= link / localStorage on mount; this is a
        // client-only read (no SSR equivalent), so the synchronous setState here is intentional.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(urlToken);
        // Also stash it in Cache Storage so the service worker can redirect a future token-less
        // launch (e.g. an installed shortcut whose start_url lost the token) back to this partner.
        if (typeof caches !== "undefined") {
          caches
            .open("ghb-pos-token")
            .then((c) => c.put("/__pos_token", new Response(urlToken)))
            .catch(() => {});
        }
      } else {
        setToken(window.localStorage.getItem(TOKEN_KEY) ?? "");
      }
    } catch {
      /* storage unavailable — fall back to the URL token */
    }
    setTokenReady(true);
  }, [urlToken]);

  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [memberName, setMemberName] = useState<string | null>(null);
  const [offlineEntry, setOfflineEntry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [queued, setQueued] = useState(0);
  const [failedSync, setFailedSync] = useState(0);
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
    const { failed } = await flushQueue();
    setQueued(queuedCount());
    if (failed > 0) setFailedSync((n) => n + failed);
  }, []);

  useEffect(() => {
    // Seed live browser/queue state on mount — both are client-only reads with no SSR value, so the
    // synchronous setState is intentional (the online/offline listeners below keep them current).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(navigator.onLine);
    setQueued(queuedCount());
    if (navigator.onLine && token) void refreshMemberDigest(token);
    void sync();
    const goOnline = () => {
      setOnline(true);
      if (token) void refreshMemberDigest(token); // keep the offline member list fresh
      void sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [sync, token]);

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
      // Verify against the cached member digest when we have one; otherwise trust and reconcile on sync.
      const status = await memberStatusOffline(token, phone);
      if (status === "no") {
        return setError("Not a member — no Bucket Rewards discount for this number.");
      }
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
      setOutcome({ kind: "queued", provisional: res.provisional });
      setStage("result");
    } else {
      setError(res.message);
    }
  }

  if (!token) {
    return (
      <Shell online={online} queued={queued} onSync={sync}>
        {tokenReady && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <XCircle className="size-10 text-destructive" />
            <p className="font-heading text-lg font-semibold text-foreground">Device not set up</p>
            <p className="text-sm text-muted-foreground">
              This link is missing its device code. Ask GHBucketlist for your Bucket Rewards device link.
            </p>
          </div>
        )}
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
              ? "Bucket Rewards is paused for this business. Contact GHBucketlist to reactivate."
              : "This link isn't recognised. Ask GHBucketlist for your Bucket Rewards device link."}
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell online={online} queued={queued} failed={failedSync} onSync={sync} partnerName={device.info?.name ?? null}>
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
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <CloudOff className="size-12 text-brand-coral" />
          <p className="font-heading text-lg font-semibold text-foreground">Saved offline</p>
          {outcome.provisional ? (
            <>
              <div className="w-full rounded-2xl border border-border p-4 text-left">
                <Row label="Customer pays" value={formatGHS(outcome.provisional.amountDue)} strong />
                <Row label="They save" value={formatGHS(outcome.provisional.customerSaving)} success />
                <Row label="Commission" value={formatGHS(outcome.provisional.commission)} muted />
              </div>
              <p className="text-xs text-muted-foreground">
                Provisional — confirmed automatically when the internet returns.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Stored on the device and will sync automatically when the internet returns.
            </p>
          )}
          <Button size="lg" className="h-14 w-full text-base" onClick={reset}>New sale</Button>
        </div>
      )}

      <OwnerSummary token={token} />
    </Shell>
  );
}

const PERIODS: { key: StatsPeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All" },
];

// Collapsible owner-only totals, gated by the PIN an admin set for this partner. The PIN is verified
// server-side; unlocking is remembered only for this session (state), never persisted to the device.
function OwnerSummary({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [unlockedPin, setUnlockedPin] = useState<string | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>("today");
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (usePin: string, p: StatsPeriod) => {
      setBusy(true);
      setError(null);
      const res = await brPartnerStats(token, usePin, p);
      setBusy(false);
      if (!res.ok) {
        setError(res.message);
        if (res.reason === "unauthorized") {
          setUnlockedPin(null);
          setStats(null);
        }
        return false;
      }
      setStats(res.stats);
      return true;
    },
    [token],
  );

  async function unlock() {
    if (busy || pin.trim().length < 4) return;
    const ok = await load(pin.trim(), period);
    if (ok) setUnlockedPin(pin.trim());
  }

  function changePeriod(p: StatsPeriod) {
    setPeriod(p);
    if (unlockedPin) void load(unlockedPin, p);
  }

  return (
    <div className="mt-8 border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Lock className="size-4" /> Owner summary
        </span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-4">
          {!unlockedPin ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">Enter the owner PIN to view your business totals.</p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && unlock()}
                  placeholder="PIN"
                  className="h-12"
                  autoComplete="off"
                />
                <Button className="h-12 px-6" disabled={busy || pin.trim().length < 4} onClick={unlock}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "View"}
                </Button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-1.5">
                {PERIODS.map((pr) => (
                  <button
                    key={pr.key}
                    type="button"
                    onClick={() => changePeriod(pr.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      period === pr.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>

              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <SummaryTile label="Redeems" value={String(stats.redeems)} />
                    <SummaryTile label="Sales through Rewards" value={formatGHS(stats.grossSales)} />
                    <SummaryTile label="Given to customers" value={formatGHS(stats.customerSavings)} success />
                    <SummaryTile label="Commission to GHB" value={formatGHS(stats.commissionTotal)} />
                  </div>
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-xs text-muted-foreground">Outstanding to settle (all time)</p>
                    <p className="mt-0.5 font-heading text-xl font-bold text-foreground">
                      {formatGHS(stats.commissionOutstanding)}
                    </p>
                  </div>
                </>
              ) : null}

              {busy && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Loading…
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryTile({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-heading text-lg font-bold", success ? "text-success" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function Shell({
  children,
  online,
  queued,
  failed = 0,
  onSync,
  partnerName,
}: {
  children: React.ReactNode;
  online: boolean;
  queued: number;
  failed?: number;
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
          <PosPwa />
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
          {failed > 0 && (
            <span
              className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-destructive"
              title="Offline sales that couldn't be confirmed (e.g. not a member) — reported to the GHBucketlist team."
            >
              <AlertTriangle className="size-3.5" /> {failed} couldn&apos;t sync
            </span>
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
