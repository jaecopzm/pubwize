import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.1)] text-[#818cf8]",
        secondary:
          "border-secondary/30 bg-secondary/10 text-secondary-foreground",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
        success:
          "border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]",
        warning:
          "border-[rgba(251,191,36,0.25)] bg-[rgba(251,191,36,0.1)] text-[#fbbf24]",
        cyan:
          "border-[rgba(34,211,238,0.25)] bg-[rgba(34,211,238,0.1)] text-[#22d3ee]",
        purple:
          "border-[rgba(167,139,250,0.25)] bg-[rgba(167,139,250,0.1)] text-[#a78bfa]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
