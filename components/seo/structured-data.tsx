/**
 * Structured Data Component
 * Renders JSON-LD structured data in the page head
 */

interface StructuredDataProps {
  data: string | object;
}

export function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = typeof data === 'string' ? data : JSON.stringify(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}
