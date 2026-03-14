"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Tag, MapPin, Languages, Sparkles, CheckCircle2, MessageSquareText, Users, BookOpen, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const POPULAR_NICHES = [
    "Technology & Software",
    "Health & Wellness",
    "Finance & Investing",
    "Travel & Lifestyle",
    "Food & Recipes",
    "Fashion & Beauty",
    "Home & Garden",
    "Business & Marketing",
];

const BRAND_VOICE_SUGGESTIONS = [
    "Professional",
    "Friendly",
    "Expert",
    "Casual",
    "Authoritative",
    "Conversational",
    "Inspiring",
    "Educational",
];

export interface SiteFormData {
    domain: string;
    siteName: string;
    niche: string;
    targetCountry?: string;
    language?: string;
    brandVoiceAdjectives?: string[];
    brandVoiceTone?: string;
    brandVoiceTargetAudience?: string;
    brandVoiceFormattingRules?: string;
    expertPersona?: string;
}

interface SiteFormProps {
    initialData?: Partial<SiteFormData>;
    submitting: boolean;
    error?: string | null;
    onSubmit: (data: SiteFormData) => Promise<void>;
}

const DEFAULT_INITIAL_DATA: Partial<SiteFormData> = {};

export default function SiteForm({ initialData = DEFAULT_INITIAL_DATA, submitting, error, onSubmit }: SiteFormProps) {
    const [domain, setDomain] = useState(initialData.domain || "");
    const [siteName, setSiteName] = useState(initialData.siteName || "");
    const [niche, setNiche] = useState(initialData.niche || "");
    const [targetCountry, setTargetCountry] = useState(initialData.targetCountry || "");
    const [language, setLanguage] = useState(initialData.language || "");

    const [selectedVoices, setSelectedVoices] = useState<string[]>(initialData.brandVoiceAdjectives || []);
    const [voiceTone, setVoiceTone] = useState(initialData.brandVoiceTone || "");
    const [voiceAudience, setVoiceAudience] = useState(initialData.brandVoiceTargetAudience || "");
    const [voiceFormatting, setVoiceFormatting] = useState(initialData.brandVoiceFormattingRules || "");
    const [expertPersona, setExpertPersona] = useState(initialData.expertPersona || "");

    useEffect(() => {
        // keep initial data in sync if it changes (for edit page after fetch)
        setDomain(initialData.domain || "");
        setSiteName(initialData.siteName || "");
        setNiche(initialData.niche || "");
        setTargetCountry(initialData.targetCountry || "");
        setLanguage(initialData.language || "");
        setSelectedVoices(initialData.brandVoiceAdjectives || []);
        setVoiceTone(initialData.brandVoiceTone || "");
        setVoiceAudience(initialData.brandVoiceTargetAudience || "");
        setVoiceFormatting(initialData.brandVoiceFormattingRules || "");
        setExpertPersona(initialData.expertPersona || "");
    }, [initialData]);

    const toggleVoice = (voice: string) => {
        setSelectedVoices(prev =>
            prev.includes(voice) ? prev.filter(v => v !== voice) : [...prev, voice]
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await onSubmit({
            domain: domain.trim(),
            siteName: siteName.trim(),
            niche: niche.trim(),
            targetCountry: targetCountry?.trim() || undefined,
            language: language?.trim() || undefined,
            brandVoiceAdjectives: selectedVoices.length > 0 ? selectedVoices : undefined,
            brandVoiceTone: voiceTone?.trim() || undefined,
            brandVoiceTargetAudience: voiceAudience?.trim() || undefined,
            brandVoiceFormattingRules: voiceFormatting?.trim() || undefined,
            expertPersona: expertPersona?.trim() || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
                <div className="card-premium rounded-xl border border-destructive/30 bg-destructive/5 p-4 lg:p-6">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Basic Information */}
            <div className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-4 lg:mb-6">
                    <Globe className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-foreground">Basic Information</h2>
                </div>

                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="domain" className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                Domain
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="domain"
                                value={domain}
                                onChange={e => setDomain(e.target.value)}
                                placeholder="example.com"
                                autoComplete="off"
                                required
                                className="focus-premium"
                            />
                            <p className="text-xs text-muted-foreground">Your website's domain name</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="siteName" className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                Site Name
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="siteName"
                                value={siteName}
                                onChange={e => setSiteName(e.target.value)}
                                placeholder="My Awesome Site"
                                autoComplete="off"
                                required
                                className="focus-premium"
                            />
                            <p className="text-xs text-muted-foreground">Display name for your site</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="niche" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            Niche
                            <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="niche"
                            value={niche}
                            onChange={e => setNiche(e.target.value)}
                            placeholder="e.g., Outdoor gear reviews and hiking guides for adventure enthusiasts"
                            autoComplete="off"
                            required
                            rows={3}
                            className="focus-premium resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Describe what your site is about and who it's for
                        </p>
                    </div>

                    {/* Popular Niches */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Popular niches:</p>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_NICHES.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setNiche(n)}
                                    className="px-3 py-1 text-xs rounded-full border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Localization */}
            <div className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-4 lg:mb-6">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-foreground">Localization</h2>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="targetCountry" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            Target Country
                        </Label>
                        <Input
                            id="targetCountry"
                            value={targetCountry}
                            onChange={e => setTargetCountry(e.target.value)}
                            placeholder="US, UK, CA, etc."
                            autoComplete="off"
                            className="focus-premium"
                        />
                        <p className="text-xs text-muted-foreground">Primary country for your audience</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="language" className="flex items-center gap-2">
                            <Languages className="h-4 w-4 text-muted-foreground" />
                            Language
                        </Label>
                        <Input
                            id="language"
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            placeholder="en, es, fr, etc."
                            autoComplete="off"
                            className="focus-premium"
                        />
                        <p className="text-xs text-muted-foreground">Primary language code</p>
                    </div>
                </div>
            </div>

            {/* Brand Voice */}
            <div className="card-premium rounded-xl lg:rounded-2xl border border-border bg-card p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-4 lg:mb-6">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-foreground">Brand Voice</h2>
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Select adjectives that describe your brand's tone and personality
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {BRAND_VOICE_SUGGESTIONS.map((voice) => (
                            <button
                                key={voice}
                                type="button"
                                onClick={() => toggleVoice(voice)}
                                className={cn(
                                    "px-4 py-2 text-sm rounded-lg border transition-all",
                                    selectedVoices.includes(voice)
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {selectedVoices.includes(voice) && (
                                    <CheckCircle2 className="h-3 w-3 inline mr-1.5" />
                                )}
                                {voice}
                            </button>
                        ))}
                    </div>

                    {selectedVoices.length > 0 && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs font-medium text-primary mb-1">Selected brand voice:</p>
                            <p className="text-sm text-foreground">{selectedVoices.join(", ")}</p>
                        </div>
                    )}

                    {/* additional persona fields */}
                    <div className="mt-6 space-y-4">
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                                <MessageSquareText className="h-4 w-4 text-teal" />
                                Voice Tone & Persona
                            </label>
                            <textarea
                                value={voiceTone}
                                onChange={e => setVoiceTone(e.target.value)}
                                placeholder="e.g. Engaging, casual but professional, slightly witty, avoids corporate jargon. Speaks directly to the reader like a knowledgeable friend."
                                className="w-full min-h-[80px] sm:min-h-[100px] rounded-xl border border-border bg-background p-3 sm:p-3.5 text-sm text-foreground focus:border-teal/50 focus:ring-1 focus:ring-teal/50 outline-none transition-all resize-y"
                            />
                            <p className="text-xs text-muted-foreground ml-1">Describe how your brand sounds and the emotional response you want to elicit.</p>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                                <Users className="h-4 w-4 text-lilac" />
                                Target Audience
                            </label>
                            <textarea
                                value={voiceAudience}
                                onChange={e => setVoiceAudience(e.target.value)}
                                placeholder="e.g. B2B SaaS founders, independent creators, or busy working parents. They value time-saving tips and actionable frameworks."
                                className="w-full min-h-[70px] sm:min-h-[80px] rounded-xl border border-border bg-background p-3 sm:p-3.5 text-sm text-foreground focus:border-lilac/50 focus:ring-1 focus:ring-lilac/50 outline-none transition-all resize-y"
                            />
                            <p className="text-xs text-muted-foreground ml-1">Who is the AI writing for? Be specific about their pain points and experience level.</p>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                                <BookOpen className="h-4 w-4 text-gold" />
                                Formatting Rules
                            </label>
                            <textarea
                                value={voiceFormatting}
                                onChange={e => setVoiceFormatting(e.target.value)}
                                placeholder="e.g. \n- Always use short sentences (max 15 words)\n- Never use the words 'unlock', 'delve', or 'landscape'\n- End every article with a specific Call to Action asking readers to leave a comment\n- Emphasize important metrics using bold text"
                                className="w-full min-h-[100px] sm:min-h-[120px] rounded-xl border border-border bg-background p-3 sm:p-3.5 text-sm text-foreground focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition-all resize-y font-mono text-[12px] sm:text-[13px]"
                            />
                            <div className="flex items-start gap-2 bg-muted/30 p-2.5 rounded-lg border border-border">
                                <AlertCircle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    These are hard rules the AI will attempt to follow on every generation. Be explicit. Overly restrictive rules may affect output length or variety.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                                <Users className="h-4 w-4 text-primary" />
                                Expert Persona
                            </label>
                            <textarea
                                value={expertPersona}
                                onChange={e => setExpertPersona(e.target.value)}
                                placeholder="e.g. Master Naval Architect with 20 years of experience in hull design and marine engineering. Authoritative, highly technical, yet accessible."
                                className="w-full min-h-[80px] sm:min-h-[100px] rounded-xl border border-border bg-background p-3 sm:p-3.5 text-sm text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all resize-y"
                            />
                            <p className="text-xs text-muted-foreground ml-1">Define the authority and role the AI should adopt. This shapes terminology and EEAT signals.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-3 sm:pt-4">
                <button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                        "btn-gold flex items-center justify-center gap-2 w-full sm:w-auto sm:ml-auto sm:px-6 py-2.5 touch-manipulation",
                        submitting && "opacity-70 cursor-not-allowed"
                    )}
                >
                    {submitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4" />
                    )}
                    {submitting ? "Saving..." : "Save Site"}
                </button>
            </div>
        </form>
    );
}
