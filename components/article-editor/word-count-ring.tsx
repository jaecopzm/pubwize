"use client";

interface WordCountRingProps {
    current: number;
    target: number;
    size?: number;
}

export function WordCountRing({ current, target, size = 64 }: WordCountRingProps) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(current / target, 1);
    const offset = circumference * (1 - progress);

    const getColor = () => {
        if (progress >= 1) return "#00D9B8"; // teal
        if (progress >= 0.7) return "#FFD700"; // gold
        return "rgba(150,150,150,0.4)"; // neutral gray
    };

    const color = getColor();

    const label =
        progress >= 1
            ? "✓"
            : current >= 1000
                ? `${(current / 1000).toFixed(1)}k`
                : String(current);

    return (
        <div className="flex flex-col items-center gap-1" title={`${current} / ${target} words`}>
            <div style={{ width: size, height: size, position: "relative" }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    {/* Track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(150,150,150,0.15)"
                        strokeWidth={5}
                    />
                    {/* Progress */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.4s ease" }}
                    />
                </svg>
                {/* Label in centre */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span
                        className="font-bold font-mono-dm leading-none"
                        style={{ fontSize: size * 0.22, color }}
                    >
                        {label}
                    </span>
                </div>
            </div>
            <span className="text-[9px] text-text-3 font-mono-dm">
                / {target >= 1000 ? `${(target / 1000).toFixed(0)}k` : target}
            </span>
        </div>
    );
}
