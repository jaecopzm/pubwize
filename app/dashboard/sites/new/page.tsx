"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/pricing/upgrade-modal";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";

import SiteForm, { SiteFormData } from "../site-form";

export default function NewSitePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { plan } = useUserPlan();

  const handleSubmit = async (data: SiteFormData) => {
    setError(null);
    try {
      setCreating(true);
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Unable to get ID token");

      const res = await fetch("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      const resp = (await res.json()) as { siteId?: string; error?: string; limit?: number };

      if (!res.ok) {
        const errorMessage = resp.error || "Failed to create site";
        
        // Check if it's a limit error
        if (res.status === 403 && resp.limit !== undefined) {
          setShowUpgradeModal(true);
        }
        
        throw new Error(errorMessage);
      }

      toast.success("Site created successfully!");
      router.push("/dashboard/sites");
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto aurora-bg noise-overlay min-h-screen">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 relative z-10"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sites
      </Button>

      <div className="mb-6 lg:mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/15">
            <Globe className="h-6 w-6 text-teal" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Create New <span className="gradient-gold-teal">Site</span>
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground ml-15">
          Set up a new site with its niche, target audience, and brand voice.
        </p>
      </div>

      <SiteForm submitting={creating} error={error} onSubmit={handleSubmit} />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={plan}
        reason={error || undefined}
        onUpgrade={(plan) => router.push('/dashboard/settings?tab=billing')}
      />
    </div>
  );
}
