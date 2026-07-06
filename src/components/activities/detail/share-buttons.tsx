"use client";

import { useState, useSyncExternalStore } from "react";
import { Link2, Check } from "lucide-react";
import { SocialIcon } from "@/components/social-icon";

function subscribeToNothing() {
  return () => {};
}

function getServerUrl() {
  return "";
}

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = useSyncExternalStore(
    subscribeToNothing,
    () => window.location.href,
    getServerUrl
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const shareText = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);

  return (
    <div className="flex items-center justify-center gap-2">
      <a
        href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on WhatsApp"
        className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .9.9-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.2.2-.4.1-.1 0-.3 0-.4 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.4 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z" />
        </svg>
      </a>
      <a
        href={`https://x.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on X"
        className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
      >
        <SocialIcon name="x" className="size-4" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on Facebook"
        className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.7c0-.9.3-1.6 1.6-1.6h1.7V3.2C16.5 3.1 15.5 3 14.3 3c-2.5 0-4.2 1.5-4.2 4.3v2.5H7.4v3.2h2.7v8h3.4z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
      >
        {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
      </button>
    </div>
  );
}
