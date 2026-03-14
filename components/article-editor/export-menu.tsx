"use client";

import { useState } from "react";
import { Download, Copy, FileCode, FileJson, Layout } from "lucide-react";
import { toast } from "sonner";

export function ExportMenu({ content, keyword }: { content: string; keyword: string }) {
    const [isOpen, setIsOpen] = useState(false);

    const downloadFile = (filename: string, text: string, type: string) => {
        const element = document.createElement("a");
        const file = new Blob([text], { type });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const mdToHtml = (md: string) => {
        // Basic regex-based conversion for export
        return md
            .replace(/^# (.*$)/gm, "<h1>$1</h1>")
            .replace(/^## (.*$)/gm, "<h2>$1</h2>")
            .replace(/^### (.*$)/gm, "<h3>$1</h3>")
            .replace(/^\* (.*$)/gm, "<li>$1</li>")
            .replace(/^- (.*$)/gm, "<li>$1</li>")
            .replace(/\*\*(.*)\*\*/gm, "<strong>$1</strong>")
            .replace(/\*(.*)\*/gm, "<em>$1</em>")
            .replace(/\n\n/g, "<br /><br />");
    };

    const handleExport = (type: "md" | "html" | "wp" | "copy-md") => {
        const filename = `${keyword.replace(/\s+/g, "-").toLowerCase()}`;

        if (type === "copy-md") {
            navigator.clipboard.writeText(content);
        } else if (type === "md") {
            downloadFile(`${filename}.md`, content, "text/markdown");
        } else if (type === "html") {
            const html = `<!DOCTYPE html><html><head><title>${keyword}</title><style>body{font-family:sans-serif;line-height:1.6;max-width:800px;margin:40px auto;padding:20px;color:#333;}</style></head><body>${mdToHtml(content)}</body></html>`;
            downloadFile(`${filename}.html`, html, "text/html");
        } else if (type === "wp") {
            navigator.clipboard.writeText(mdToHtml(content));
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text-1 transition-all hover:border-gold/40 hover:bg-gold/5 shadow-premium"
            >
                <Download className="h-3.5 w-3.5" />
                Export Article
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-30 w-56 overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl shadow-black/20 animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-1">
                            <button
                                onClick={() => handleExport("copy-md")}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-text-1 hover:bg-gold/10 hover:text-gold transition-colors"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                Copy as Markdown
                            </button>
                            <button
                                onClick={() => handleExport("md")}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-text-1 hover:bg-gold/10 hover:text-gold transition-colors"
                            >
                                <FileCode className="h-3.5 w-3.5" />
                                Download as .md
                            </button>
                            <button
                                onClick={() => handleExport("html")}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-text-1 hover:bg-gold/10 hover:text-gold transition-colors"
                            >
                                <FileJson className="h-3.5 w-3.5" />
                                Download as HTML
                            </button>
                            <div className="my-1 h-px bg-border/60" />
                            <button
                                onClick={() => handleExport("wp")}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-text-1 hover:bg-teal/10 hover:text-teal transition-colors"
                            >
                                <Layout className="h-3.5 w-3.5 text-teal" />
                                Copy for WordPress
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
