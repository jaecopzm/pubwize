"use client";

import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Loader2, Sparkles, ChevronDown, Minus, Plus, RefreshCw, AlignLeft, Type, Highlighter, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BubbleMenu } from "@tiptap/react/menus";
import { cn } from "@/lib/utils";

// ── Simple markdown → HTML (for initial import) ────────────────────
function markdownToHtml(md: string): string {
  let cleanMd = md.trim();
  if (cleanMd.startsWith("```markdown")) {
    cleanMd = cleanMd.replace(/^```markdown\s*\n/, "");
    if (cleanMd.endsWith("```")) {
      cleanMd = cleanMd.replace(/\n```$/, "");
    }
  } else if (cleanMd.startsWith("```")) {
    cleanMd = cleanMd.replace(/^```[a-zA-Z]*\s*\n/, "");
    if (cleanMd.endsWith("```")) {
      cleanMd = cleanMd.replace(/\n```$/, "");
    }
  }

  return cleanMd
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^[-*+] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hpuo])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}

// ── Simple HTML → Markdown (for onChange export) ──────────────────
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<s[^>]*>([\s\S]*?)<\/s>/gi, "~~$1~~")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<img[^>]+>/gi, (match) => {
      const srcMatch = match.match(/src="([^"]+)"/i);
      const altMatch = match.match(/alt="([^"]*)"/i);
      const src = srcMatch ? srcMatch[1] : "";
      const alt = altMatch ? altMatch[1] : "";
      return `\n\n![${alt}](${src})\n\n`;
    })
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<\/?[uoa]l[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── AI Action types ────────────────────────────────────────────────
type AIAction = "rewrite" | "shorten" | "expand" | "formal" | "casual" | "regenerate-section";

const AI_ACTIONS: { id: AIAction; label: string; icon: string }[] = [
  { id: "rewrite", label: "Rewrite", icon: "✨" },
  { id: "shorten", label: "Shorten", icon: "📉" },
  { id: "expand", label: "Expand", icon: "📈" },
  { id: "formal", label: "Formal", icon: "👔" },
  { id: "casual", label: "Casual", icon: "💬" },
  { id: "regenerate-section", label: "Regen Section", icon: "⚡" },
];

interface RichEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  keyword?: string;
  articleId?: string;
  readonly?: boolean;
  streaming?: boolean;
  onUpgradeRequired?: (reason: string) => void;
}

export interface RichEditorRef {
  insertContent: (html: string) => void;
}

export const RichEditor = forwardRef<RichEditorRef, RichEditorProps>(({
  value,
  onChange,
  keyword = "",
  articleId,
  readonly = false,
  streaming = false,
  onUpgradeRequired,
}, ref) => {
  const [aiAction, setAiAction] = useState<AIAction | null>(null);
  const [floatingPos, setFloatingPos] = useState<{ top: number; left: number } | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(false);
  const prevValueRef = useRef(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your article… or press / for AI commands",
        emptyEditorClass: "is-editor-empty",
      }),
      CharacterCount,
    ],
    content: markdownToHtml(value),
    editable: !readonly && !streaming,
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        spellcheck: "true",
      },
    },
    onUpdate({ editor }) {
      const md = htmlToMarkdown(editor.getHTML());
      prevValueRef.current = md;
      onChange(md);
    },
  });

  useImperativeHandle(ref, () => ({
    insertContent: (html: string) => {
      if (editor) {
        editor.chain().focus().insertContent(html).run();
      }
    }
  }), [editor]);

  // Sync external value changes (streaming) into the editor
  const isStreamingRef = useRef(streaming);
  const lastUpdateLengthRef = useRef(0);
  isStreamingRef.current = streaming;
  
  useEffect(() => {
    if (!editor) return;
    
    // During streaming, batch updates (only update every 100 chars)
    if (isStreamingRef.current) {
      const lengthDiff = Math.abs(value.length - lastUpdateLengthRef.current);
      if (lengthDiff < 100 && value.length > 0) return;
      lastUpdateLengthRef.current = value.length;
    } else {
      // Not streaming, check if value actually changed
      if (value === prevValueRef.current) return;
    }
    
    prevValueRef.current = value;

    const { from, to } = editor.state.selection;
    editor.commands.setContent(markdownToHtml(value), { emitUpdate: false });
    // Restore cursor position after content update
    try {
      editor.commands.setTextSelection({ from, to });
    } catch { }
  }, [value, editor]);

  // Toggle editable based on streaming/readonly props
  useEffect(() => {
    editor?.setEditable(!readonly && !streaming);
  }, [readonly, streaming, editor]);

  // Track text selection to show/hide floating toolbar
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim().length < 2) {
        setHasSelection(false);
        setFloatingPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const wRect = wrapper.getBoundingClientRect();
      setFloatingPos({
        top: rect.top - wRect.top - 48, // 48px above selection
        left: Math.max(0, rect.left - wRect.left + rect.width / 2 - 110), // centred, clamped
      });
      setHasSelection(true);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const handleAIAction = async (action: AIAction) => {
    if (!editor || aiAction) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    // Section regeneration — uses the entire nearest heading block
    if (action === "regenerate-section") {
      if (!articleId) { toast.error("Article ID missing"); return; }
      // Find the nearest heading text above the selection
      let sectionHeading = "";
      let sectionContent = selectedText || "";
      editor.state.doc.nodesBetween(0, from, (node) => {
        if (node.type.name.startsWith("heading")) sectionHeading = node.textContent;
      });
      if (!sectionHeading) { toast.error("Place cursor inside a section to regenerate it"); return; }
      setAiAction(action);
      try {
        const res = await fetch("/api/articles/regenerate-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionHeading, sectionContent, keyword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Regeneration failed");
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, data.newContent).run();
        toast.success("Section regenerated!");
      } catch (err: any) {
        toast.error(err.message || "Section regeneration failed");
      } finally {
        setAiAction(null);
      }
      return;
    }

    if (!selectedText.trim()) {
      toast.error("Please select some text first");
      return;
    }

    setAiAction(action);

    try {
      const response = await fetch("/api/articles/ai-improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: selectedText,
          keyword,
          improvementType: action,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.upgradeRequired && onUpgradeRequired) {
          onUpgradeRequired(data.error || "Upgrade required");
          return;
        }
        throw new Error(data.error || "Failed to improve content");
      }

      // Stream the improved content
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let improvedContent = "";
      let accumulatedRaw = "";

      // Delete the selected text first
      editor.chain().focus().deleteRange({ from, to }).run();

      while (true) {
        const { done: rdDone, value } = await reader.read();
        if (rdDone) break;

        accumulatedRaw += decoder.decode(value, { stream: true });
        const lines = accumulatedRaw.split("\n");
        accumulatedRaw = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") continue;

          try {
            const payload = JSON.parse(dataStr);
            if (payload.error) throw new Error(payload.error);
            if (payload.chunk) {
              improvedContent += payload.chunk;
              // Update editor with accumulated content
              editor.chain().focus().deleteRange({ from, to: from + improvedContent.length }).insertContentAt(from, improvedContent).run();
            }
            if (payload.done) {
              toast.success(`Content ${action === "rewrite" ? "rewritten" : action + "ed"}!`);
            }
          } catch (parseErr) {
            // Ignore malformed chunks
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "AI action failed");
    } finally {
      setAiAction(null);
    }
  };

  return (
    <div className={`rich-editor-wrapper${heatmapOn ? " heatmap-on" : ""}`} ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Toolbar row: Heatmap toggle */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          onClick={() => setHeatmapOn(!heatmapOn)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${heatmapOn
            ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
            : "border-white/10 text-text-3 hover:text-text-2 hover:border-white/20"
            }`}
          title="Toggle Readability Heatmap — highlights long sentences"
        >
          {heatmapOn ? "🌡️ Heatmap On" : "🌡️ Readability"}
        </button>
      </div>

      {/* Glassmorphism Bubble Menu — appears on text selection */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="bubble-menu-v2 flex items-center gap-1 p-1 bg-obsidian-90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-1 pr-1 border-r border-white/10 mr-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("p-2 rounded-lg transition-all hover:bg-white/10", editor.isActive("bold") ? "text-gold bg-gold/10" : "text-text-3")}
              title="Bold"
            >
              <span className="font-bold text-sm">B</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("p-2 rounded-lg transition-all hover:bg-white/10", editor.isActive("italic") ? "text-gold bg-gold/10" : "text-text-3")}
              title="Italic"
            >
              <span className="italic text-sm">I</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {AI_ACTIONS.map((action) => (
              <button
                key={action.id}
                onMouseDown={(e) => { e.preventDefault(); handleAIAction(action.id); }}
                disabled={!!aiAction}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                  aiAction === action.id 
                    ? "bg-gold text-obsidian" 
                    : "text-text-2 hover:bg-white/10 hover:text-white"
                )}
              >
                {aiAction === action.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-sm">{action.icon}</span>
                )}
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            ))}
          </div>
        </BubbleMenu>
      )}

      {/* Streaming overlay */}
      {streaming && (
        <div className="streaming-overlay">
          <div className="streaming-cursor" />
        </div>
      )}

      <EditorContent editor={editor} />

      <style>{`
        .rich-editor-wrapper {
          position: relative;
        }

        .rich-editor-content {
          min-height: 500px;
          outline: none;
          color: var(--text-1);
          font-size: 0.875rem;
          line-height: 1.7;
          font-family: var(--font-sans, system-ui, sans-serif);
        }

        @media (min-width: 640px) {
          .rich-editor-content {
            font-size: 0.925rem;
            line-height: 1.8;
          }
        }

        .rich-editor-content.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-3);
          pointer-events: none;
          height: 0;
        }

        .rich-editor-content h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 1.5rem 0 0.75rem;
          color: var(--text-1);
          line-height: 1.3;
        }
        .rich-editor-content h2 {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 1.5rem 0 0.5rem;
          color: var(--text-1);
          line-height: 1.4;
        }
        .rich-editor-content h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 1rem 0 0.25rem;
          color: var(--text-1);
        }
        .rich-editor-content p {
          margin-bottom: 0.75rem;
          color: var(--text-2);
        }
        .rich-editor-content strong {
          color: var(--text-1);
          font-weight: 600;
        }
        .rich-editor-content em { font-style: italic; }
        .rich-editor-content code {
          background: var(--surface-2);
          color: var(--teal);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.85em;
          font-family: monospace;
        }
        .rich-editor-content ul,
        .rich-editor-content ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
          color: var(--text-2);
        }
        .rich-editor-content li { margin-bottom: 0.25rem; }
        .rich-editor-content blockquote {
          border-left: 3px solid var(--gold);
          padding-left: 1rem;
          margin: 1rem 0;
          color: var(--text-3);
          font-style: italic;
        }

        /* Bubble menu v2 */
        .bubble-menu-v2 {
          animation: bubbleGrow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bubbleGrow {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .rich-editor-content {
          border-radius: 12px;
          transition: all 0.4s ease;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid transparent;
        }

        .rich-editor-content:focus-within {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(212, 175, 55, 0.1);
          box-shadow: 0 0 50px -12px rgba(212, 175, 55, 0.05);
        }

        /* Streaming cursor */
        .streaming-overlay {
          pointer-events: none;
        }
        .streaming-cursor {
          display: inline-block;
          width: 2px;
          height: 1.2em;
          background: var(--gold);
          border-radius: 1px;
          animation: blink 0.8s step-start infinite;
          vertical-align: text-bottom;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Tiptap selection */
        .rich-editor-content ::selection {
          background: rgba(234, 179, 8, 0.25);
        }

        /* ── Readability Heatmap ──────────────────────────────────────
           When .heatmap-on is active, we highlight long sentences
           using a CSS content-length trick on <p> elements.
           Since we can't split sentences client-side without JS,
           we highlight the entire paragraph if it's long.
        ────────────────────────────────────────────────────────────── */
        .heatmap-on .rich-editor-content p {
          transition: background 0.3s ease;
          border-radius: 3px;
          padding: 0 2px;
        }
        /* Paragraphs with more than ~150 chars ≈ "long" */
        .heatmap-on .rich-editor-content p:not(:empty) {
          --char-len: 0;
        }
        /* We use a JS-side class approach instead: add .long-sentence / .very-long-sentence */
        .heatmap-on .rich-editor-content .long-sentence {
          background: rgba(245, 158, 11, 0.12);
          border-bottom: 2px solid rgba(245, 158, 11, 0.4);
          border-radius: 2px;
          padding: 0 1px;
        }
        .heatmap-on .rich-editor-content .very-long-sentence {
          background: rgba(239, 68, 68, 0.10);
          border-bottom: 2px solid rgba(239, 68, 68, 0.45);
          border-radius: 2px;
          padding: 0 1px;
        }
      `}</style>
    </div>
  );
});
