import { getAllPosts, type PostMeta } from "@/lib/blog";
import { redis } from "@/lib/redis";

const CACHE_KEY = "blog:all";
const CACHE_TTL = 3600;

export async function getCachedPosts(): Promise<PostMeta[]> {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached as string);
  } catch {}

  const posts = await getAllPosts();

  try {
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(posts));
  } catch {}

  return posts;
}

export async function invalidateBlogCache() {
  try {
    await redis.del(CACHE_KEY);
  } catch {}
}

export function paginatePosts(posts: PostMeta[], page = 1, perPage = 9) {
  const start = (page - 1) * perPage;
  return {
    posts: posts.slice(start, start + perPage),
    total: posts.length,
    page,
    totalPages: Math.ceil(posts.length / perPage),
    hasNext: start + perPage < posts.length,
    hasPrev: page > 1,
  };
}
