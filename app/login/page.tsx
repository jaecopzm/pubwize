"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect from old /login route to new /auth/signin route
 * This ensures backward compatibility for any bookmarks or external links
 */
export default function LoginRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/auth/signin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center aurora-bg noise-overlay">
      <div className="text-text-2">Redirecting to sign in...</div>
    </div>
  );
}
