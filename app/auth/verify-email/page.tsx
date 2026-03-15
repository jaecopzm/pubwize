"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Sparkles, Mail, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/signin");
        return;
      }
      
      setEmail(user.email || "");
      
      if (user.emailVerified) {
        toast.success("Email verified successfully!");
        router.push("/dashboard");
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      
      if (!user) {
        toast.error("No user found. Please sign up again.");
        router.push("/auth/signup");
        return;
      }

      await sendEmailVerification(user);
      toast.success("Verification email sent! Please check your inbox.");
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      console.error("Resend email error:", error);
      toast.error(error.message || "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      
      if (!user) {
        toast.error("No user found. Please sign up again.");
        router.push("/auth/signup");
        return;
      }

      await user.reload();
      
      if (user.emailVerified) {
        toast.success("Email verified successfully!");
        router.push("/dashboard");
      } else {
        toast.error("Email not verified yet. Please check your inbox.");
      }
    } catch (error: any) {
      console.error("Check verification error:", error);
      toast.error(error.message || "Failed to check verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 aurora-bg noise-overlay">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6 group transition-transform hover:scale-105">
            <img src="/PubWize.png" alt="Pubwize" className="h-10 sm:h-12" />
          </Link>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gold/10 border border-gold/20">
              <Mail className="w-12 h-12 text-gold" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-1 mb-2">Verify your email</h1>
          <p className="text-sm sm:text-base text-text-3">
            We've sent a verification link to
          </p>
          <p className="text-sm sm:text-base text-gold font-semibold mt-1">
            {email}
          </p>
        </div>

        {/* Instructions Card */}
        <div className="card-premium p-6 sm:p-8 bg-surface-1 border border-border space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                1
              </div>
              <div>
                <p className="text-sm text-text-2">
                  Check your email inbox for a message from Pubwize
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                2
              </div>
              <div>
                <p className="text-sm text-text-2">
                  Click the verification link in the email
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                3
              </div>
              <div>
                <p className="text-sm text-text-2">
                  Return here and click "I've verified my email"
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={loading}
              className="btn-gold w-full py-2.5 sm:py-3 text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              I've verified my email
            </button>

            <button
              onClick={handleResendEmail}
              disabled={loading || resendCooldown > 0}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-surface-2 text-text-1 text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:bg-surface-2/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              {resendCooldown > 0 
                ? `Resend email (${resendCooldown}s)` 
                : "Resend verification email"}
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-text-3 text-center">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={handleResendEmail}
                disabled={loading || resendCooldown > 0}
                className="text-gold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                resend it
              </button>
            </p>
          </div>
        </div>

        {/* Back to Sign In */}
        <p className="text-center text-sm text-text-3">
          Wrong email?{" "}
          <Link href="/auth/signup" className="text-gold font-semibold hover:text-gold/80 transition-colors">
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  );
}
