"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Paddle?: any;
  }
}

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddleLoaded, setPaddleLoaded] = useState(false);

  useEffect(() => {
    if (paddleLoaded && window.Paddle) {
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      const environment = process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox";
      
      if (!token) {
        console.warn("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN not configured");
        return;
      }
      
      window.Paddle.Environment.set(environment);
      window.Paddle.Initialize({
        token,
        eventCallback: (event: any) => {
          console.log("Paddle event:", event);
        },
      });
    }
  }, [paddleLoaded]);

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={() => setPaddleLoaded(true)}
        strategy="lazyOnload"
      />
      {children}
    </>
  );
}
