import { Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  plan?: "starter" | "pro";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PremiumBadge({ plan = "pro", size = "sm", className }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: "text-[9px] px-2 py-0.5 gap-1",
    md: "text-[10px] px-2.5 py-1 gap-1.5",
    lg: "text-xs px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: 9,
    md: 10,
    lg: 12,
  };

  return (
    <span
      className={cn(
        "badge-gold inline-flex items-center font-mono-dm font-bold uppercase tracking-wider",
        sizeClasses[size],
        className
      )}
    >
      <Crown size={iconSizes[size]} className="shrink-0" />
      {plan === "pro" ? "Pro" : "Starter+"}
    </span>
  );
}
