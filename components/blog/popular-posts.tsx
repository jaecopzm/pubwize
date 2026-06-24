import Link from "next/link";
import { getCachedPosts } from "@/lib/blog-cache";
import { TrendingUp } from "lucide-react";

export async function PopularPosts() {
  const posts = await getCachedPosts();
  const popular = [...posts]
    .filter(p => (p.views ?? 0) > 0)
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 5);

  if (popular.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-[#818cf8]" />
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#818cf8]">Popular</span>
      </div>
      <ul className="space-y-3">
        {popular.map((post, i) => (
          <li key={post.slug} className="flex items-start gap-3">
            <span className="text-xs font-bold text-muted-foreground/40 w-4 mt-0.5 shrink-0">{i + 1}</span>
            <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-foreground hover:text-[#818cf8] transition-colors line-clamp-2">
              {post.title}
              <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                {post.views?.toLocaleString()} views
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
