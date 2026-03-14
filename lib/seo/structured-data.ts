/**
 * JSON-LD Structured Data Generators
 * Helps search engines understand your content better
 */

interface Organization {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

interface WebSite {
  name: string;
  url: string;
  description: string;
  potentialAction: {
    '@type': string;
    target: string;
    'query-input': string;
  };
}

interface SoftwareApplication {
  name: string;
  applicationCategory: string;
  offers: {
    '@type': string;
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: string;
    ratingCount: string;
  };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pubwize.com';
  
  const organization: Organization = {
    name: 'Pubwize',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'AI-powered SEO content platform for creating rank-ready articles',
    sameAs: [
      // Add your social media profiles here
      // 'https://twitter.com/pubwize',
      // 'https://linkedin.com/company/pubwize',
    ],
  };

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    ...organization,
  });
}

/**
 * Generate WebSite structured data with search action
 */
export function generateWebSiteSchema(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pubwize.com';
  
  const website: WebSite = {
    name: 'Pubwize',
    url: baseUrl,
    description: 'Create rank-ready articles in minutes with AI',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/dashboard/research?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    ...website,
  });
}

/**
 * Generate SoftwareApplication structured data
 */
export function generateSoftwareApplicationSchema(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pubwize.com';
  
  const software: SoftwareApplication = {
    name: 'Pubwize',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    // Add when you have reviews
    // aggregateRating: {
    //   '@type': 'AggregateRating',
    //   ratingValue: '4.8',
    //   ratingCount: '127',
    // },
  };

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    ...software,
    operatingSystem: 'Web',
    url: baseUrl,
    description: 'AI-powered SEO content platform for creating rank-ready articles in minutes',
    featureList: [
      'AI Content Generation',
      'SEO Optimization',
      'WordPress Publishing',
      'Keyword Research',
      'Content Calendar',
    ],
  });
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pubwize.com';
  
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${baseUrl}${item.url}`,
  }));

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  });
}

/**
 * Generate FAQPage structured data
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): string {
  const mainEntity = faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }));

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  });
}

/**
 * Generate Article structured data
 */
export function generateArticleSchema(article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pubwize.com';
  
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Pubwize',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image || `${baseUrl}/og-image.png`,
  });
}
