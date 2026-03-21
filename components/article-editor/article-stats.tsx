"use client";

interface ArticleStatsProps {
  wordCount: number;
  readabilityScore: number;
  readabilityLabel: string;
  readabilityColor: string;
  keywordDensity: string;
  idealDensity: boolean;
}

export function ArticleStats({
  wordCount,
  readabilityScore,
  readabilityLabel,
  readabilityColor,
  keywordDensity,
  idealDensity,
}: ArticleStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[rgba(99,102,241,0.05)] p-3">
        <div className="text-xs font-mono mb-1 text-muted-foreground">Words</div>
        <div className="text-lg font-bold font-mono text-[#818cf8]" key={wordCount}>
          {wordCount.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(34,211,238,0.2)] bg-[rgba(34,211,238,0.05)] p-3">
        <div className="text-xs font-mono mb-1 text-muted-foreground">Readability</div>
        <div
          className="text-lg font-bold font-mono"
          style={{ color: readabilityColor }}
          key={readabilityScore}
        >
          {readabilityScore}
        </div>
        <div className="text-[10px] font-mono mt-0.5 text-muted-foreground">
          {readabilityLabel}
        </div>
      </div>

      <div
        className="rounded-xl border p-3"
        style={{
          borderColor: idealDensity ? 'rgba(34,211,238,0.2)' : 'rgba(244,63,94,0.2)',
          background: idealDensity ? 'rgba(34,211,238,0.05)' : 'rgba(244,63,94,0.05)',
        }}
      >
        <div className="text-xs font-mono mb-1 text-muted-foreground">Keyword</div>
        <div
          className="text-lg font-bold font-mono"
          style={{ color: idealDensity ? '#22d3ee' : '#f43f5e' }}
          key={keywordDensity}
        >
          {keywordDensity}%
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(167,139,250,0.2)] bg-[rgba(167,139,250,0.05)] p-3">
        <div className="text-xs font-mono mb-1 text-muted-foreground">Read Time</div>
        <div className="text-lg font-bold font-mono text-[#a78bfa]" key={wordCount}>
          {Math.ceil(wordCount / 200)} min
        </div>
      </div>
    </div>
  );
}
