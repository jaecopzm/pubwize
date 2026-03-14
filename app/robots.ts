import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pubwize.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/action',
          '/auth/verify-email',
          '/auth/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
