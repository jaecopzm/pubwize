"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyLink}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-gold/30 hover:bg-gold/5 transition-all"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-teal" />
          <span className="text-teal">Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" />
          <span>Copy link</span>
        </>
      )}
    </button>
  );
}
