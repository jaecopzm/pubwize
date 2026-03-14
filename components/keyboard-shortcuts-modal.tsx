"use client";

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["1", "2", "3", "4"], description: "Select example keyword", category: "Quick Actions" },
  { keys: ["Enter"], description: "Submit form (when ready)", category: "Quick Actions" },
  { keys: ["Esc"], description: "Clear keyword input", category: "Quick Actions" },
  { keys: ["?"], description: "Show this help", category: "Help" },
];

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.shiftKey && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-surface-1/80 backdrop-blur-sm px-3 py-2 text-xs text-text-2 transition-all hover:bg-surface-1 hover:text-text-1 hover:scale-105 shadow-lg"
        title="Keyboard shortcuts"
      >
        <Keyboard className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Press ? for shortcuts</span>
      </button>
    );
  }

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-surface-1 p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-gold" />
            <h3 className="text-lg font-bold text-text-1">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-text-3 transition-colors hover:bg-white/5 hover:text-text-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">
                {category}
              </h4>
              <div className="space-y-2">
                {items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-text-2">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded border border-white/10 bg-white/5 text-xs font-mono text-text-1">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-text-4">/</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-xs text-text-3 text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-text-2">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
