"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ActionMode = "verifyEmail" | "resetPassword" | "recoverEmail" | null;

function AuthActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ActionMode>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    const handleAction = async () => {
      const actionMode = searchParams.get("mode") as ActionMode;
      const actionCode = searchParams.get("oobCode");

      if (!actionCode) {
        setError("Invalid or missing action code");
        setLoading(false);
        return;
      }

      setMode(actionMode);

      try {
        const auth = getFirebaseAuth();

        switch (actionMode) {
          case "verifyEmail":
            try {
              await applyActionCode(auth, actionCode);
              setSuccess(true);
              toast.success("Email verified successfully!");
              setTimeout(() => router.push("/dashboard"), 2000);
            } catch (err: any) {
              // If code is invalid, it might have been already used or processed by Firebase
              if (err.code === "auth/invalid-action-code" || err.code === "auth/expired-action-code") {
                // Check if user is signed in and email is already verified
                const currentUser = auth.currentUser;
                if (currentUser) {
                  await currentUser.reload();
                  if (currentUser.emailVerified) {
                    setSuccess(true);
                    toast.success("Email already verified!");
                    setTimeout(() => router.push("/dashboard"), 2000);
                    return;
                  }
                }
                // If not signed in or not verified, show helpful message
                setError("This verification link has expired or was already used. Please sign in or request a new verification email.");
                return;
              }
              throw err;
            }
            break;

          case "resetPassword":
            // Verify the code is valid
            await verifyPasswordResetCode(auth, actionCode);
            setSuccess(true);
            break;

          case "recoverEmail":
            await applyActionCode(auth, actionCode);
            setSuccess(true);
            toast.success("Email recovered successfully!");
            setTimeout(() => router.push("/auth/signin"), 2000);
            break;

          default:
            setError("Invalid action mode");
        }
      } catch (err: any) {
        console.error("Action error:", err);
        setError(err.message || "An error occurred");
        toast.error(err.message || "Action failed");
      } finally {
        setLoading(false);
      }
    };

    handleAction();
  }, [searchParams, router]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setResettingPassword(true);
      const auth = getFirebaseAuth();
      const actionCode = searchParams.get("oobCode");

      if (!actionCode) {
        throw new Error("Invalid action code");
      }

      await confirmPasswordReset(auth, actionCode, newPassword);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/auth/signin"), 2000);
    } catch (err: any) {
      console.error("Password reset error:", err);
      toast.error(err.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 aurora-bg noise-overlay">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-text-2">Processing your request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isVerificationError = error.includes("verification") || error.includes("expired") || error.includes("already used");
    
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 aurora-bg noise-overlay">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group transition-transform hover:scale-105">
              <img src="/PubWize.png" alt="Pubwize" className="h-10 sm:h-12" />
            </Link>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-text-1 mb-2">
              {isVerificationError ? "Verification Link Issue" : "Action Failed"}
            </h1>
            <p className="text-text-3 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <Link href="/auth/signin" className="btn-gold inline-flex items-center justify-center gap-2 px-6 py-3">
                Sign In
              </Link>
              {isVerificationError && (
                <Link href="/auth/verify-email" className="text-sm text-gold hover:text-gold/80 transition-colors">
                  Resend verification email
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "resetPassword" && success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 aurora-bg noise-overlay">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 group transition-transform hover:scale-105">
              <img src="/PubWize.png" alt="Pubwize" className="h-10 sm:h-12" />
            </Link>
            <h1 className="text-3xl font-extrabold text-text-1 mb-2">Reset Your Password</h1>
            <p className="text-text-3 mb-6">Enter your new password below</p>
          </div>

          <div className="card-premium p-8 bg-surface-1 border border-border">
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-2 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={resettingPassword}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface-2 text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all disabled:opacity-50"
                />
                <p className="text-xs text-text-3 mt-1.5">At least 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-2 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={resettingPassword}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface-2 text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={resettingPassword}
                className="btn-gold w-full py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resettingPassword ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 aurora-bg noise-overlay">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group transition-transform hover:scale-105">
            <img src="/PubWize.png" alt="Pubwize" className="h-10 sm:h-12" />
          </Link>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-teal/10 border border-teal/20">
              <CheckCircle className="w-12 h-12 text-teal" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-text-1 mb-2">
            {mode === "verifyEmail" && "Email Verified!"}
            {mode === "recoverEmail" && "Email Recovered!"}
          </h1>
          <p className="text-text-3 mb-6">
            {mode === "verifyEmail" && "Your email has been verified successfully. Redirecting to dashboard..."}
            {mode === "recoverEmail" && "Your email has been recovered. Redirecting to sign in..."}
          </p>
          <Link href="/dashboard" className="btn-gold inline-flex items-center gap-2 px-6 py-3">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 aurora-bg noise-overlay">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-text-2">Loading...</p>
        </div>
      </div>
    }>
      <AuthActionContent />
    </Suspense>
  );
}
