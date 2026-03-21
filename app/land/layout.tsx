import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pubwize — AI-Powered SEO Content That Actually Ranks",
  description:
    "Generate full SEO-optimized articles in under 90 seconds. From keyword research to WordPress publishing — all in one AI-first content platform. Start free today.",
  keywords: [
    "AI SEO content",
    "AI article writer",
    "SEO content generator",
    "WordPress AI publishing",
    "content marketing automation",
    "AI blog writer",
    "keyword research tool",
    "topical authority",
    "programmatic SEO",
    "AI content platform",
  ],
  openGraph: {
    title: "Pubwize — AI-Powered SEO Content That Actually Ranks",
    description:
      "Generate full SEO-optimized articles in under 90 seconds. From keyword research to WordPress publishing — all in one AI-first content platform.",
    type: "website",
    url: "/land",
    siteName: "Pubwize",
    images: [
      {
        url: "/pubwize-social-img.png",
        width: 1200,
        height: 630,
        alt: "Pubwize AI Content Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pubwize — AI-Powered SEO Content That Actually Ranks",
    description:
      "Generate full SEO-optimized articles in under 90 seconds. Start free today.",
    images: ["/pubwize-social-img.png"],
    creator: "@pubwize",
  },
  alternates: {
    canonical: "/land",
  },
};

export default function LandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
