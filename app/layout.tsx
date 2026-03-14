import type { Metadata } from "next";
import { Manrope, DM_Mono, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { SWRProvider } from "@/components/performance/swr-provider";
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";
import { ResourceHints } from "@/components/performance/resource-hints";
import { GoogleAnalytics } from "@/components/google-analytics";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Pubwize - AI-Powered SEO Content Platform",
    template: "%s | Pubwize"
  },
  description: "Create rank-ready articles in minutes with AI. From keyword research to WordPress publishing - all in one platform. Start free, no credit card required.",
  keywords: [
    "AI content writing",
    "SEO content generator",
    "WordPress publishing",
    "content marketing",
    "AI article writer",
    "SEO optimization",
    "content automation",
    "blog post generator",
    "keyword research",
    "content calendar"
  ],
  authors: [{ name: "Pubwize" }],
  creator: "Pubwize",
  publisher: "Pubwize",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://pubwize.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Pubwize - AI-Powered SEO Content Platform",
    description: "Create rank-ready articles in minutes with AI. From keyword research to WordPress publishing - all in one platform.",
    siteName: "Pubwize",
    images: [
      {
        url: "/pubwize-social-img.png",
        width: 1200,
        height: 630,
        alt: "Pubwize - AI-Powered SEO Content Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Pubwize - AI-Powered SEO Content Platform",
    description: "Create rank-ready articles in minutes with AI. From keyword research to WordPress publishing - all in one platform.",
    images: ["/pubwize-social-img.png"],
    creator: "@pubwize"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${dmMono.variable} ${dmSerif.variable} antialiased`}
        style={{ fontFamily: 'var(--font-manrope), sans-serif' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </SWRProvider>
          <Toaster position="top-right" expand={false} richColors />
        </ThemeProvider>
        <WebVitalsReporter />
        <ResourceHints />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
