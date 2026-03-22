import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/s2/favicons/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:",
              "connect-src 'self' https: http:",
              "frame-src 'self' https: http:",
              "img-src 'self' data: https: http:",
              "style-src 'self' 'unsafe-inline' https:",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://pubwize.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;