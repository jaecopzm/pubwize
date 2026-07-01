import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Roboto, Syne, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { SWRProvider } from "@/components/performance/swr-provider";
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";
import { ResourceHints } from "@/components/performance/resource-hints";
import { GoogleAnalytics } from "@/components/google-analytics";
import { PaddleProvider } from "@/components/paddle-provider";
import { CommandPalette } from "@/components/command-palette";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const satoshi = localFont({
  src: [
    {
      path: '../public/fonts/satoshi-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/satoshi-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/satoshi-700.woff2',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-satoshi'
});



export const metadata: Metadata = {
  title: {
    default: "Pubwize — AI-Powered SEO Content That Actually Ranks",
    template: "%s | Pubwize"
  },
  description: "Generate full SEO-optimized articles in under 90 seconds. From keyword research to WordPress publishing — all in one AI-first content platform. Start free today.",
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
  authors: [{ name: "Pubwize" }],
  creator: "Pubwize",
  publisher: "Pubwize",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://pubwize.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Pubwize — AI-Powered SEO Content That Actually Ranks",
    description: "Generate full SEO-optimized articles in under 90 seconds. From keyword research to WordPress publishing — all in one AI-first content platform.",
    siteName: "Pubwize",
    images: [
      {
        url: "/pubwize-social-img.png",
        width: 1200,
        height: 630,
        alt: "Pubwize AI Content Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Pubwize — AI-Powered SEO Content That Actually Ranks",
    description: "Generate full SEO-optimized articles in under 90 seconds. Start free today.",
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
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
        <body
        className={`${satoshi.variable} ${jakarta.variable} ${roboto.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        style={{ fontFamily: 'var(--font-satoshi), sans-serif' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange
        >
          <PaddleProvider>
            <SWRProvider>
              <ErrorBoundary>
                {children}
                <CommandPalette />
              </ErrorBoundary>
            </SWRProvider>
            <Toaster position="top-right" expand={false} richColors />
          </PaddleProvider>
        </ThemeProvider>
        <WebVitalsReporter />
        <ResourceHints />
        <GoogleAnalytics />
      </body>
    </html>
    </ClerkProvider>
  );
}
