import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pubwize.com';
  const currentDate = new Date();

  const blogPosts = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    { url: baseUrl, lastModified: currentDate, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.8 },
    ...blogPosts,
    { url: `${baseUrl}/pricing`, lastModified: currentDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/auth/signin`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/auth/signup`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/refunds`, lastModified: currentDate, changeFrequency: 'monthly', priority: 0.4 },
  ];
}
