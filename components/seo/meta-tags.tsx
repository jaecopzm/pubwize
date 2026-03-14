/**
 * SEO Meta Tags Component
 * Easy way to add meta tags to any page
 */

import Head from 'next/head';

interface MetaTagsProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
}

export function MetaTags({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  keywords,
  author,
  publishedTime,
  modifiedTime,
  noindex = false,
}: MetaTagsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pubwize.com';
  const fullTitle = title.includes('Pubwize') ? title : `${title} | Pubwize`;
  const imageUrl = ogImage || `${baseUrl}/og-image.png`;
  const canonicalUrl = canonical || baseUrl;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="Pubwize" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:creator" content="@pubwize" />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#D4AF37" />
    </Head>
  );
}
