import { type PostMeta } from "@/lib/blog";

export function getRelatedPosts(current: PostMeta, all: PostMeta[], limit = 3): PostMeta[] {
  const currentTags = new Set(current.tags.map(t => t.toLowerCase()));

  return all
    .filter(p => p.slug !== current.slug)
    .map(p => {
      const shared = p.tags.filter(t => currentTags.has(t.toLowerCase())).length;
      return { p, score: shared * 1000 + new Date(p.date).getTime() / 1e9 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.p);
}
