"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
}

function Sparkline({ data, color, height = 32 }: SparklineProps) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `M ${points[0]} L ${points.join(" L ")} L ${w - pad},${h - pad} L ${pad},${h - pad} Z`;

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-fill-${color.replace("#", "")})`} />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last dot */}
      <circle
        cx={points[points.length - 1].split(",")[0]}
        cy={points[points.length - 1].split(",")[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    const start = prev.current;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

interface KPICardProps {
  label: string;
  value: number;
  suffix?: string;
  trend?: number; // percentage change vs last period
  trendLabel?: string;
  icon: React.ReactNode;
  accentColor: string; // hex e.g. "#6366f1"
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}

export function KPICard({
  label,
  value,
  suffix = "",
  trend,
  trendLabel,
  icon,
  accentColor,
  sparklineData,
  onClick,
  className,
}: KPICardProps) {
  const animatedValue = useCountUp(value);

  const trendPositive = trend !== undefined && trend > 0;
  const trendNeutral = trend === undefined || trend === 0;
  const TrendIcon = trendNeutral ? Minus : trendPositive ? TrendingUp : TrendingDown;
  const trendColor = trendNeutral
    ? "text-muted-foreground"
    : trendPositive
    ? "text-emerald-500"
    : "text-red-400";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2 sm:gap-3 overflow-hidden rounded-lg border p-3 sm:p-4 text-left",
        "transition-all duration-300",
        "hover:scale-[1.025] hover:shadow-xl",
        "active:scale-[0.98]",
        onClick ? "cursor-pointer" : "cursor-default",
        className
      )}
      style={{
        backgroundColor: `${accentColor}10`,
        borderColor: `${accentColor}20`,
        color: accentColor,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${accentColor}22, 0 2px 8px rgba(0,0,0,0.12)`;
        (e.currentTarget as HTMLElement).style.backgroundColor = `${accentColor}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "";
        (e.currentTarget as HTMLElement).style.backgroundColor = `${accentColor}10`;
      }}
    >
      {/* Ambient gradient blob */}
      <div
        className="absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{ background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)` }}
      />

      {/* Top row: icon + sparkline */}
      <div className="flex items-start justify-between">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center">
          {icon}
        </div>
        {sparklineData && <Sparkline data={sparklineData} color={accentColor} />}
      </div>

      {/* Value */}
      <div className="flex items-end gap-1">
        <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none" style={{ color: accentColor }}>
          {animatedValue.toLocaleString()}
        </span>
        {suffix && (
          <span className="mb-0.5 text-xs sm:text-sm font-semibold opacity-60">{suffix}</span>
        )}
      </div>

      {/* Label + Trend */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-70">{label}</p>
        {trend !== undefined && (
          <span className={cn("flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-bold", trendColor)}>
            <TrendIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {Math.abs(trend)}%<span className="hidden sm:inline">{trendLabel ? ` ${trendLabel}` : ""}</span>
          </span>
        )}
      </div>
    </button>
  );
}
