import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-card/50 border-border h-10 w-full min-w-0 rounded-xl border px-4 py-2 text-base shadow-sm transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[rgba(99,102,241,0.4)] focus-visible:ring-2 focus-visible:ring-primary/20",
        "hover:border-[rgba(99,102,241,0.2)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
