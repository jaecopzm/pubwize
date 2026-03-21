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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://sandbox-cdn.paddle.com",
              "connect-src 'self' https://checkout-service.paddle.com https://sandbox-checkout-service.paddle.com https://api.paddle.com https://sandbox-api.paddle.com",
              "frame-src 'self' https://cdn.paddle.com https://sandbox-cdn.paddle.com https://buy.paddle.com https://sandbox-buy.paddle.com",
              "img-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline'",
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