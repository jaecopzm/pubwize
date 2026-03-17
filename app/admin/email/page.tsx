"use client";

import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { 
  Mail, 
  Users, 
  Crown, 
  Eye, 
  Send, 
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Bold,
  Italic,
  Link,
  Image,
  List,
  Quote
} from "lucide-react";
import { cn } from "@/lib/utils";

type Segment = "all" | "paid" | "free" | "custom";

const SEGMENTS: { value: Segment; label: string; desc: string; icon: any; color: string }[] = [
  { value: "all", label: "All Users", desc: "Everyone (respects unsubscribes)", icon: Users, color: "text-muted-foreground" },
  { value: "paid", label: "Paid Users", desc: "Active subscribers only", icon: Crown, color: "text-gold" },
  { value: "free", label: "Free Users", desc: "Free / no plan users", icon: Users, color: "text-teal" },
  { value: "custom", label: "Custom List", desc: "Paste specific emails", icon: Edit3, color: "text-lilac" },
];

export default function AdminEmailPage() {
  const [segment, setSegment] = useState<Segment>("all");
  const [customEmails, setCustomEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState("");

  function insertText(before: string, after: string = "") {
    const textarea = document.querySelector('textarea[placeholder*="Your message"]') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = html.substring(start, end);
    const newText = html.substring(0, start) + before + selectedText + after + html.substring(end);
    
    setHtml(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  }

  function insertLink() {
    const url = prompt("Enter URL:");
    if (url) {
      const text = prompt("Enter link text:") || url;
      insertText(`[${text}](${url})`);
    }
  }

  function insertImage() {
    const url = prompt("Enter image URL:");
    if (url) {
      const alt = prompt("Enter alt text:") || "Image";
      insertText(`![${alt}](${url})`);
    }
  }

  async function send() {
    if (!subject.trim() || !html.trim()) { setError("Subject and body required"); return; }
    if (!confirm(`Send to segment: "${segment}"? This will send real emails.`)) return;

    setSending(true);
    setError("");
    setResult(null);

    const token = await getFirebaseAuth().currentUser?.getIdToken();
    const res = await fetch("/api/admin/email", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        html,
        segment,
        customEmails: segment === "custom"
          ? customEmails.split(/[\n,]+/).map((e) => e.trim()).filter(Boolean)
          : undefined,
      }),
    });

    const data = await res.json();
    setSending(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setResult(data);
  }

  return (
    <div className="space-y-8 max-w-4xl relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-lilac/20 to-gold/20 flex items-center justify-center flex-shrink-0">
          <Mail className="h-5 w-5 text-lilac" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold">Email Campaign</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Send targeted emails to user segments</p>
        </div>
      </div>

      {/* Audience Selection */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-gradient-to-r from-gold to-teal rounded-full" />
          <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Select Audience
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SEGMENTS.map((seg) => (
            <button
              key={seg.value}
              onClick={() => setSegment(seg.value)}
              className={cn(
                "rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-1",
                segment === seg.value 
                  ? "border-gold/40 bg-gold/5 shadow-lg shadow-gold/10" 
                  : "border-border bg-card hover:border-gold/20 hover:shadow-lg"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  segment === seg.value ? "bg-gold/20" : "bg-muted/50"
                )}>
                  <seg.icon className={cn("h-4 w-4", segment === seg.value ? "text-gold" : seg.color)} />
                </div>
                <span className="font-semibold text-sm">{seg.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{seg.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Custom Email List */}
      {segment === "custom" && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-gradient-to-r from-teal to-lilac rounded-full" />
            <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Email Addresses
            </h2>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <textarea
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              placeholder="one@example.com, two@example.com&#10;or one per line"
              rows={6}
              className="w-full bg-transparent border-0 resize-none text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </section>
      )}

      {/* Email Content */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-gradient-to-r from-lilac to-gold rounded-full" />
          <h2 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Email Content
          </h2>
        </div>

        {/* Subject Line */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Subject Line</label>
          <div className="rounded-2xl border border-border bg-card p-4">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your compelling subject line..."
              className="w-full bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Email Body */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Email Body</label>
            <button
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:border-gold/30 hover:bg-gold/5 transition-all"
            >
              {preview ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          
          {/* Formatting Toolbar */}
          {!preview && (
            <div className="flex items-center gap-1 p-2 border border-border rounded-xl bg-muted/30">
              <button
                onClick={() => insertText("**", "**")}
                className="p-2 rounded-lg hover:bg-card transition-colors"
                title="Bold"
              >
                <Bold className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => insertText("*", "*")}
                className="p-2 rounded-lg hover:bg-card transition-colors"
                title="Italic"
              >
                <Italic className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="w-px h-6 bg-border mx-1" />
              <button
                onClick={insertLink}
                className="p-2 rounded-lg hover:bg-card transition-colors"
                title="Insert Link"
              >
                <Link className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={insertImage}
                className="p-2 rounded-lg hover:bg-card transition-colors"
                title="Insert Image"
              >
                <Image className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="w-px h-6 bg-border mx-1" />
              <button
                onClick={() => insertText("- ")}
                className="p-2 rounded-lg hover:bg-card transition-colors"
                title="Bullet List"
              >
                <List className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => insertText("> ")}
                className="p-2 rounded-lg hover:bg-card transition-colors"
                title="Quote"
              >
                <Quote className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {preview ? (
              <div className="p-6 min-h-[300px] whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
                {html.split('\n').map((line, i) => {
                  // Basic markdown rendering for preview
                  let processedLine = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-gold underline">$1</a>')
                    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded" />')
                    .replace(/^> (.*)/, '<blockquote class="border-l-4 border-gold pl-4 italic">$1</blockquote>')
                    .replace(/^- (.*)/, '<li class="ml-4">• $1</li>');
                  
                  return (
                    <div key={i} dangerouslySetInnerHTML={{ __html: processedLine || '<br>' }} />
                  );
                })}
              </div>
            ) : (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="Hi there,

Your message here...

**Bold text** or *italic text*
[Link text](https://example.com)
![Alt text](https://example.com/image.jpg)

Best regards,
The Pubwize Team"
                rows={15}
                className="w-full p-6 bg-transparent border-0 resize-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
              />
            )}
          </div>
        </div>
      </section>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-500/20 bg-red-500/5">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-500">{error}</p>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-teal/20 bg-teal/5">
          <CheckCircle2 className="h-5 w-5 text-teal flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-teal">
              Successfully sent {result.sent} of {result.total} emails
            </p>
            {result.failed > 0 && (
              <p className="text-xs text-red-500 mt-1">{result.failed} emails failed to send</p>
            )}
          </div>
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={send}
          disabled={sending || !subject.trim() || !html.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-obsidian font-semibold hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gold/20 hover:shadow-gold/40"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : "Send Campaign"}
        </button>
      </div>
    </div>
  );
}
