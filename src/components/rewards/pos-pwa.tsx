"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Registers the offline service worker for the counter page and, when the browser offers it, shows
 * an "Install app" button so the partner can add the POS to their home screen and launch it offline.
 */
// Whether the page is already running as an installed standalone app. Read via an external-store
// subscription so it needs no synchronous setState inside an effect (and stays SSR-safe: false on the server).
function useStandalone() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia?.("(display-mode: standalone)");
      mq?.addEventListener("change", onChange);
      return () => mq?.removeEventListener("change", onChange);
    },
    () => window.matchMedia?.("(display-mode: standalone)").matches ?? false,
    () => false,
  );
}

export function PosPwa() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const standalone = useStandalone();
  const installed = standalone || appInstalled;

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setAppInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  if (installed || !deferred) return null;

  return (
    <button
      type="button"
      onClick={install}
      className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
    >
      <Download className="size-3.5" />
      Install for offline use
    </button>
  );
}
