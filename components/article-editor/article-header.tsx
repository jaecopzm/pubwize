"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ArticleHeaderProps {
  title: string;
  keyword: string;
  zenMode: boolean;
  toggleZenMode: () => void;
}

export function ArticleHeader({ title, keyword, zenMode, toggleZenMode }: ArticleHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>
      
      <div className="text-center flex-1 mx-4">
        <h1 className="text-lg font-bold text-foreground truncate">
          {title || keyword}
        </h1>
      </div>

      <button
        onClick={toggleZenMode}
        className="px-2 py-1 text-xs font-medium rounded-lg border border-border hover:bg-accent transition-colors"
      >
        {zenMode ? "Exit" : "Zen"}
      </button>
    </div>
  );
}
