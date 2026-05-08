"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  FileText,
  Globe,
  Settings,
  Plus,
  LayoutDashboard,
  Search,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-[640px]">
        <VisuallyHidden>
          <DialogTitle>Command Menu</DialogTitle>
        </VisuallyHidden>
        <Command className="rounded-lg border-0">
          <Command.Input
            placeholder="Type a command or search..."
            className="h-12 px-4 text-sm border-0 border-b border-border focus:outline-none focus:ring-0"
          />
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/articles/new"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Plus className="h-4 w-4" />
                <span>New Article</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>N
                </kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/sites/new"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Globe className="h-4 w-4" />
                <span>New Site</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-border my-2" />

            <Command.Group heading="Navigation" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/articles"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <FileText className="h-4 w-4" />
                <span>Articles</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/calendar"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/research"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Search className="h-4 w-4" />
                <span>Research</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/sites"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Globe className="h-4 w-4" />
                <span>Sites</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/analytics"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
