"use client";

const authorBios: Record<string, { bio: string; role: string }> = {
  "Pubwize Team": {
    bio: "The Pubwize team is building the future of AI-powered SEO content. We combine expertise in content strategy, search optimization, and machine learning to help brands scale their organic growth.",
    role: "Content Team",
  },
  "Jaey": {
    bio: "Building Pubwize — AI-first content platform. Passionate about SEO, distributed systems, and helping creators rank.",
    role: "Founder",
  },
};

export function AuthorCard({ author }: { author: string }) {
  const info = authorBios[author] || {
    bio: `Written by ${author}. Part of the Pubwize content team — dedicated to helping you rank higher with AI-powered SEO.`,
    role: "Contributor",
  };

  return (
    <div className="flex items-start gap-4 py-5 px-6 rounded-xl border border-border bg-card/50">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-teal flex items-center justify-center shrink-0 overflow-hidden">
        <img src="/pubwize-icon.png" alt="Pubwize" className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-foreground">{author}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{info.role}</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{info.bio}</p>
      </div>
    </div>
  );
}
