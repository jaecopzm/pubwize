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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-2.5 sm:p-3">
        <div className="text-[10px] sm:text-xs font-mono-dm mb-1 text-text-3">Words</div>
        <div className="text-base sm:text-lg font-bold font-mono-dm text-gold" key={wordCount}>
          {wordCount.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl border border-teal/20 bg-teal/5 p-2.5 sm:p-3">
        <div className="text-[10px] sm:text-xs font-mono-dm mb-1 text-text-3">Readability</div>
        <div
          className="text-base sm:text-lg font-bold font-mono-dm"
          style={{ color: readabilityColor }}
          key={readabilityScore}
        >
          {readabilityScore}
        </div>
        <div className="text-[9px] sm:text-[10px] font-mono-dm mt-0.5 text-text-3">
          {readabilityLabel}
        </div>
      </div>

      <div
        className="rounded-xl border p-2.5 sm:p-3"
        style={{
          borderColor: idealDensity ? 'rgba(0,217,180,0.2)' : 'rgba(255,107,107,0.2)',
          background: idealDensity ? 'rgba(0,217,180,0.05)' : 'rgba(255,107,107,0.05)',
        }}
      >
        <div className="text-[10px] sm:text-xs font-mono-dm mb-1 text-text-3">Keyword</div>
        <div
          className="text-base sm:text-lg font-bold font-mono-dm"
          style={{ color: idealDensity ? 'var(--teal)' : '#ff6b6b' }}
          key={keywordDensity}
        >
          {keywordDensity}%
        </div>
      </div>

      <div className="rounded-xl border border-gold/20 bg-gold/5 p-2.5 sm:p-3">
        <div className="text-[10px] sm:text-xs font-mono-dm mb-1 text-text-3">Read Time</div>
        <div className="text-base sm:text-lg font-bold font-mono-dm text-gold" key={wordCount}>
          {Math.ceil(wordCount / 200)} min
        </div>
      </div>
    </div>
  );
}
