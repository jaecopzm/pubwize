"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
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
            <img src="/PubWize.png" alt="Pubwize" className="h-24 sm:h-28" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-1 mb-2">Reset password</h1>
          <p className="text-sm sm:text-base text-text-3">
            {sent ? "Check your email for reset instructions" : "Enter your email to receive a reset link"}
          </p>
        </div>

        {/* Form Card */}
        <div className="card-premium p-6 sm:p-8 bg-surface-1 border border-border">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-teal" />
              </div>
              <p className="text-sm sm:text-base text-text-2 mb-6">
                We've sent a password reset link to <strong className="text-text-1">{email}</strong>
              </p>
              <Link 
                href="/auth/signin" 
                className="btn-gold inline-block w-full sm:w-auto px-6 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-text-2 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-surface-2 text-text-1 text-sm sm:text-base placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="btn-gold w-full py-2.5 sm:py-3 text-sm sm:text-base mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              {/* Back Link */}
              <Link
                href="/auth/signin"
                className="flex items-center justify-center gap-2 mt-4 text-sm text-text-3 hover:text-text-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
