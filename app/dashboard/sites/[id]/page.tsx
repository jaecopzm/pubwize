"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import { toast } from "sonner";

import SiteForm, { SiteFormData } from "../site-form";

export default function EditSitePage() {
    const router = useRouter();
    const params = useParams();
    const siteId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<Partial<SiteFormData>>({});

    useEffect(() => {
        if (!siteId) return;
        fetchSite();
    }, [siteId]);

    const fetchSite = async () => {
        setLoading(true);
        try {
            const auth = getFirebaseAuth();
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) {
                throw new Error("Not authenticated");
            }

            const res = await fetch(`/api/sites/${siteId}`, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!res.ok) throw new Error("Failed to fetch site");

            const data = await res.json();
            const site = data.site;

            setInitialData({
                domain: site.domain || "",
                siteName: site.siteName || "",
                niche: site.niche || "",
                targetCountry: site.targetCountry || "",
                language: site.language || "",
                brandVoiceAdjectives: site.brandVoice?.adjectives,
                brandVoiceTone: site.brandVoice?.tone,
                brandVoiceTargetAudience: site.brandVoice?.targetAudience,
                brandVoiceFormattingRules: site.brandVoice?.formattingRules,
                expertPersona: site.brandVoice?.expertPersona,
            });
        } catch (err) {
            console.error("Failed to load site:", err);
            toast.error("Failed to load site details");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: SiteFormData) => {
        if (!siteId) return;
        setSaving(true);
        setError(null);
        try {
            const auth = getFirebaseAuth();
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error("Not authenticated");

            const res = await fetch(`/api/sites/${siteId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Update failed");

            toast.success("Site updated");
            router.push("/dashboard/sites");
        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : "Error";
            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-64 rounded-xl lg:rounded-2xl shimmer bg-muted" />
                <div className="h-40 rounded-xl lg:rounded-2xl shimmer bg-muted" />
            </div>
        );
    }

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

            {/* header */}
            <div className="mb-6 lg:mb-8 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/15">
                        <Globe className="h-6 w-6 text-teal" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Edit <span className="gradient-gold-teal">Site</span>
                        </h1>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground ml-15">
                    Update settings, niche, or brand voice for this site.
                </p>
            </div>

            {error && (
                <div className="card-premium rounded-xl border border-destructive/30 bg-destructive/5 p-4 lg:p-6">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            <SiteForm
                initialData={initialData}
                submitting={saving}
                error={error}
                onSubmit={handleSave}
            />
        </div>
    );
}
