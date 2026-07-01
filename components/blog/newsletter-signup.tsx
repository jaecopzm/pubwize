"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    try {
      const res = await fetch("/api/blog/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to subscribe");
      }
      setState("done");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setState("error");
    }
  };

  return (
    <div className="rounded-2xl border border-[rgba(99,102,241,0.2)] bg-gradient-to-br from-[rgba(99,102,241,0.05)] to-[rgba(34,211,238,0.05)] p-8">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-4 w-4 text-[#818cf8]" />
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#818cf8]">Newsletter</span>
      </div>

      {state === "done" ? (
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          You're subscribed! We'll send you the best SEO content weekly.
        </div>
      ) : (
        <>
          <h3 className="text-xl font-black mb-1">Get weekly SEO insights</h3>
          <p className="text-sm text-muted-foreground mb-5">
            No fluff. Just actionable strategies that move the needle.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[#6366f1]/50 focus:ring-2 focus:ring-[#6366f1]/20 transition-all"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#6366f1] px-4 text-sm font-semibold text-white hover:bg-[#5254cc] transition-colors disabled:opacity-60"
            >
              {state === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Subscribe <ArrowRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </form>
          {state === "error" && (
            <p className="text-xs text-red-400 mt-2">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
