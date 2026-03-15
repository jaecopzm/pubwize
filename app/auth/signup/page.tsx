"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Sparkles, Eye, EyeOff, Check, X } from "lucide-react";
import { toast } from "sonner";

interface PasswordStrength {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutPlan = searchParams.get('plan');
  const checkoutBilling = searchParams.get('billing');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [showStrength, setShowStrength] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && u.emailVerified) {
        if (checkoutPlan) {
          router.push(`/dashboard/settings?checkout=${checkoutPlan}&billing=${checkoutBilling || 'monthly'}`);
        } else {
          router.push("/dashboard");
        }
      }
    });
    return () => unsub();
  }, [router, checkoutPlan, checkoutBilling]);

  useEffect(() => {
    if (password) {
      setPasswordStrength({
        hasMinLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      });
      setShowStrength(true);
    } else {
      setShowStrength(false);
    }
  }, [password]);

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isPasswordStrong) {
      toast.error("Please meet all password requirements");
      return;
    }

    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification
      await sendEmailVerification(user);

      // Create user document
      await fetch("/api/user/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, email: user.email })
      });

      toast.success("Account created! Please check your email to verify your account.");

      // Redirect to verification waiting page
      router.push(checkoutPlan ? `/auth/verify-email?checkout=${checkoutPlan}&billing=${checkoutBilling || 'monthly'}` : "/auth/verify-email");
    } catch (error: any) {
      const message = error.code === "auth/email-already-in-use"
        ? "Email already in use"
        : error.code === "auth/weak-password"
          ? "Password is too weak"
          : error.message || "Sign up failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      // Create user document
      await fetch("/api/user/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, email: user.email })
      });

      toast.success("Account created successfully!");
      if (checkoutPlan) {
        router.push(`/dashboard/settings?checkout=${checkoutPlan}&billing=${checkoutBilling || 'monthly'}`);
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Google sign up error:", error);
      toast.error(error.message || "Google sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 aurora-bg noise-overlay">
      <div className="w-full max-w-[380px] sm:max-w-[420px]">
        {/* Form Card */}
        <div className="card-premium p-5 sm:p-7 bg-surface-1 border border-border shadow-xl">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-3 sm:mb-4 group transition-transform hover:scale-105">
              <img src="/PubWize.png" alt="Pubwize" className="h-10 sm:h-12" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-text-1 mb-1">Create your account</h1>
            <p className="text-xs sm:text-sm text-text-3">Get started with Pubwize</p>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-3 sm:space-y-3.5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-text-2 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-surface-2 text-text-1 text-sm placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-text-2 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-2 text-text-1 text-sm placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all disabled:opacity-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicators */}
              {showStrength && (
                <div className="mt-2 space-y-1">
                  <PasswordRequirement met={passwordStrength.hasMinLength} text="8+ characters" />
                  <PasswordRequirement met={passwordStrength.hasUpperCase} text="Uppercase letter" />
                  <PasswordRequirement met={passwordStrength.hasLowerCase} text="Lowercase letter" />
                  <PasswordRequirement met={passwordStrength.hasNumber} text="Number" />
                  <PasswordRequirement met={passwordStrength.hasSpecialChar} text="Special character" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-text-2 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-surface-2 text-text-1 text-sm placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all disabled:opacity-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-1 transition-colors touch-manipulation"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Passwords don't match
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-teal mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordStrong || password !== confirmPassword}
              className="btn-gold w-full py-2.5 text-sm font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation"
            >
              {loading ? "Creating account..." : "Continue"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 sm:my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface-1 px-2 text-xs text-text-3">Or continue with</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-text-1 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-2/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="hidden sm:inline">Continue with Google</span>
            <span className="sm:hidden">Google</span>
          </button>

          {/* Sign In Link */}
          <p className="text-center mt-4 sm:mt-5 text-xs text-text-3">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-gold font-semibold hover:text-gold/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen aurora-bg bg-background" />}>
      <SignUpForm />
    </Suspense>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] ${met ? 'text-teal' : 'text-text-3'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );
}
