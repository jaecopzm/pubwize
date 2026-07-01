"use client";

export function TagChip({ tag, className }: { tag: string; className?: string }) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        window.location.href = `/blog?tag=${tag}`;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          window.location.href = `/blog?tag=${tag}`;
        }
      }}
      className={className}
    >
      {tag}
    </span>
  );
}
