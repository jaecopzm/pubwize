"use client";

import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Loader2,
  Sparkles,
  ChevronDown,
  Minus,
  Plus,
  RefreshCw,
  AlignLeft,
  Type,
  Highlighter,
  Wand2,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Quote,
  Code2,
} from "lucide-react";
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

  const handleLinkPrompt = () => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("Enter link URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className={cn("rich-editor-wrapper relative", heatmapOn && "heatmap-on")} ref={wrapperRef}>
      {/* Toolbar row: Heatmap toggle */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          onClick={() => setHeatmapOn(!heatmapOn)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
            heatmapOn
              ? "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/10"
              : "border-white/5 bg-white/5 text-white/20 hover:text-white/40 hover:border-white/10"
          )}
          title="Toggle Readability Heatmap"
        >
          <Highlighter className="h-3 w-3" />
          {heatmapOn ? "Neural Heatmap Active" : "Diagnostic Mode"}
        </button>
      </div>



      {/* Streaming overlay */}
      <AnimatePresence>
        {streaming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 pointer-events-none bg-indigo-500/[0.02] border border-indigo-500/10 rounded-3xl"
          />
        )}
      </AnimatePresence>

      <EditorContent editor={editor} />

      {/* Floating Formatting Toolbar — fixed, centered over editor column */}
      {editor && !readonly && !streaming && typeof document !== "undefined" && createPortal(
        <div
          className="fixed bottom-4 z-50 flex items-center gap-0.5 p-1 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl shadow-black/30 overflow-x-auto scrollbar-hide -translate-x-1/2 transition-[left] duration-200"
          style={{ left: "calc(var(--sidebar-left-w, 0px) + (100vw - var(--sidebar-left-w, 0px) - 320px) / 2)" }}
        >
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo2} title="Undo (Ctrl+Z)" />
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo2} title="Redo" />
            <ToolbarSeparator />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} icon={Bold} title="Bold" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} icon={Italic} title="Italic" />
            <ToolbarSeparator />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} icon={Heading1} title="Heading 1" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} icon={Heading2} title="Heading 2" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} icon={Heading3} title="Heading 3" />
            <ToolbarSeparator />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} icon={List} title="Bullet List" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} icon={ListOrdered} title="Numbered List" />
            <ToolbarSeparator />
            <ToolbarButton onClick={handleLinkPrompt} active={editor.isActive("link")} icon={Link2} title="Insert Link" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} icon={Quote} title="Blockquote" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} icon={Code2} title="Code Block" />
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} title="Insert Horizontal Rule" />
        </div>,
        document.body
      )}

      <style>{`
        .ProseMirror.rich-editor-content {
          min-height: 400px;
          padding-bottom: 72px !important;
          outline: none;
          color: hsl(var(--foreground)) !important;
          font-size: 0.85rem !important;
          line-height: 1.55 !important;
          font-family: inherit;
          padding: 0;
          border-radius: 0;
          transition: all 0.3s ease;
          background: transparent;
          border: none;
        }

        @media (min-width: 640px) {
          .ProseMirror.rich-editor-content {
            min-height: 500px;
            font-size: 0.9rem !important;
          }
        }

        .ProseMirror.rich-editor-content:focus {
          background: transparent;
          border: none;
          box-shadow: none;
        }

        .ProseMirror.rich-editor-content.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
          font-weight: 500;
          font-style: italic;
        }

        .ProseMirror.rich-editor-content h1 {
          font-size: 1.3rem !important;
          font-weight: 700;
          letter-spacing: -0.015em;
          margin: 1.1rem 0 0.5rem !important;
          color: hsl(var(--foreground)) !important;
          line-height: 1.25 !important;
        }
        
        @media (min-width: 640px) {
          .ProseMirror.rich-editor-content h1 {
            font-size: 1.5rem !important;
          }
        }
        
        @media (min-width: 768px) {
          .ProseMirror.rich-editor-content h1 {
            font-size: 1.85rem !important;
          }
        }
        
        .ProseMirror.rich-editor-content h2 {
          font-size: 1.1rem !important;
          font-weight: 700;
          letter-spacing: -0.015em;
          margin: 0.9rem 0 0.4rem !important;
          color: hsl(var(--foreground)) !important;
          line-height: 1.3 !important;
        }
        
        @media (min-width: 640px) {
          .ProseMirror.rich-editor-content h2 {
            font-size: 1.25rem !important;
          }
        }
        
        @media (min-width: 768px) {
          .ProseMirror.rich-editor-content h2 {
            font-size: 1.4rem !important;
          }
        }
        
        .ProseMirror.rich-editor-content h3 {
          font-size: 1rem !important;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0.7rem 0 0.3rem !important;
          color: hsl(var(--foreground)) !important;
        }
        
        @media (min-width: 640px) {
          .ProseMirror.rich-editor-content h3 {
            font-size: 1.1rem !important;
          }
        }
        
        .ProseMirror.rich-editor-content p {
          margin-bottom: 0.5rem !important;
          color: hsl(var(--foreground)) !important;
        }
        
        .rich-editor-content strong {
          color: hsl(var(--foreground));
          font-weight: 600;
        }
        
        .rich-editor-content code {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          border: 1px solid rgba(34, 211, 238, 0.1);
        }
        .rich-editor-content ul,
        .rich-editor-content ol {
          padding-left: 1.75rem;
          margin-bottom: 2rem;
        }
        .rich-editor-content li { 
          margin-bottom: 0.5rem;
          position: relative;
        }
        .rich-editor-content blockquote {
          border-left: 4px solid #6366f1;
          padding: 1rem 2rem;
          margin: 2.5rem 0;
          background: rgba(99, 102, 241, 0.05);
          border-radius: 0 16px 16px 0;
          font-style: italic;
          color: rgba(255, 255, 255, 0.5);
        }
        .rich-editor-content img {
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin: 3rem 0;
          box-shadow: 0 32px 64px -16px rgba(0, 0, 0, 0.5);
        }

        .bubble-menu-v2 {
          animation: bubbleIn 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: scale(0.9) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Heatmap Highlighting */
        .heatmap-on .rich-editor-content p {
          transition: background 0.4s ease;
        }
        .heatmap-on .rich-editor-content .long-sentence {
          background: rgba(245, 158, 11, 0.1);
          border-bottom: 2px solid rgba(245, 158, 11, 0.3);
          border-radius: 4px;
        }
        .heatmap-on .rich-editor-content .very-long-sentence {
          background: rgba(239, 68, 68, 0.08);
          border-bottom: 2px solid rgba(239, 68, 68, 0.4);
          border-radius: 4px;
        }

        /* Selection styling */
        .rich-editor-content ::selection {
          background: rgba(99, 102, 241, 0.3);
          color: white;
        }
      `}</style>
    </div>
  );
});

// ── Toolbar Subcomponents ──────────────────────────────────────────
function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  icon: Icon,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-all active:scale-95 shrink-0",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="h-4 w-px bg-border/80 mx-1 shrink-0" />;
}
