"use client";

import { cn } from "@/lib/utils";

interface WordCountRingProps {
    current: number;
    target: number;
    size?: number;
    streaming?: boolean;
}

export function WordCountRing({ current, target, size = 64, streaming = false }: WordCountRingProps) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(current / target, 1);
    const offset = circumference * (1 - progress);

    const color =
        progress >= 1 ? "#10b981" :
        progress >= 0.7 ? "#6366f1" :
        progress >= 0.3 ? "#22d3ee" :
        "rgba(148,163,184,0.3)";

    const glowColor =
        progress >= 1 ? "rgba(16,185,129,0.4)" :
        progress >= 0.7 ? "rgba(99,102,241,0.4)" :
        "rgba(34,211,238,0.3)";

    const label =
        progress >= 1
            ? "✓"
            : current >= 1000
                ? `${(current / 1000).toFixed(1)}k`
                : String(current);

    return (
        <div className="flex flex-col items-center gap-1" title={`${current} / ${target} words`}>
            <div style={{ width: size, height: size, position: "relative" }}>
                {/* Glow layer */}
                {progress > 0.2 && (
                    <div
                        className="absolute inset-0 rounded-full opacity-30 blur-md transition-all duration-700"
                        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
                    />
                )}
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "relative", zIndex: 1 }}>
                    {/* Track */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={5}
                    />
                    {/* Streaming shimmer ring */}
                    {streaming && (
                        <circle
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none" stroke={color} strokeWidth={5}
                            strokeDasharray={`${circumference * 0.15} ${circumference * 0.85}`}
                            strokeLinecap="round" opacity={0.5}
                            style={{ animation: "spin 1.5s linear infinite" }}
                        />
                    )}
                    {/* Progress */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke={color} strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease" }}
                    />
                </svg>
                {/* Label */}
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                    <span className="font-black font-mono leading-none transition-colors duration-300"
                        style={{ fontSize: size * 0.22, color }}>
                        {label}
                    </span>
                </div>
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">
                / {target >= 1000 ? `${(target / 1000).toFixed(0)}k` : target}
            </span>
        </div>
    );
}
