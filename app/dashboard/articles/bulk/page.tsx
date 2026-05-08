"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Plus, X, Loader2, CheckCircle2, AlertCircle, Upload, FileText, Settings2, TrendingUp, Sparkles } from "lucide-react";
import { useSites } from "@/lib/hooks/use-sites";
import { useUserPlan } from "@/lib/hooks/use-swr-fetch";
import { toast } from "sonner";
import Link from "next/link";
import { PremiumBadge } from "@/components/ui/premium-badge";

interface BulkArticle {
  id: string;
  keyword: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  articleId?: string;
  error?: string;
}

type Tab = 'generate' | 'research';

export default function BulkGenerationPage() {
  const router = useRouter();
  const { sites } = useSites();
  const { plan } = useUserPlan();
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [siteId, setSiteId] = useState("");
  const [keywords, setKeywords] = useState<string[]>([""]);
  const [articles, setArticles] = useState<BulkArticle[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [wordCount, setWordCount] = useState(1500);
  const [bulkInput, setBulkInput] = useState("");
  const [batchName, setBatchName] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);

  const addKeyword = () => {
    if (keywords.length < 10) {
      setKeywords([...keywords, ""]);
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const updateKeyword = (index: number, value: string) => {
    const updated = [...keywords];
    updated[index] = value;
    setKeywords(updated);
  };

  const handleBulkImport = () => {
    const lines = bulkInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 10) {
      toast.error("Maximum 10 keywords allowed");
      return;
    }
    setKeywords(lines.length > 0 ? lines : [""]);
    setBulkInput("");
    toast.success(`Imported ${lines.length} keywords`);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.split(',')[0].trim()).filter(l => l.length > 0);
      if (lines.length > 10) {
        toast.error("Maximum 10 keywords allowed");
        return;
      }
      setKeywords(lines.length > 0 ? lines : [""]);
      toast.success(`Imported ${lines.length} keywords from CSV`);
    };
    reader.readAsText(file);
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadResults = () => {
    const csv = articles
      .filter(a => a.articleId)
      .map(a => `${a.keyword},https://pubwize.com/dashboard/articles/${a.articleId}`)
      .join('\n');
    
    const blob = new Blob([`Keyword,Article URL\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batchName || 'bulk-generation'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!siteId) {
      toast.error("Please select a site");
      return;
    }

    const validKeywords = keywords.filter(k => k.trim().length > 0);
    if (validKeywords.length === 0) {
      toast.error("Please enter at least one keyword");
      return;
    }

    setGenerating(true);
    const bulkArticles: BulkArticle[] = validKeywords.map((kw, i) => ({
      id: `bulk-${i}`,
      keyword: kw.trim(),
      status: 'generating',
    }));
    setArticles(bulkArticles);

    // Start countdown timer (4 min per article estimate for full generation)
    const estimatedTime = validKeywords.length * 240; // 4 minutes per article
    setTimeRemaining(estimatedTime);
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    // Generate all articles in parallel with rate limiting
    const promises = bulkArticles.map(async (article, index) => {
      // Stagger requests by 500ms to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, index * 500));
      
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          // Step 1: Create article with brief
          const createRes = await fetch("/api/articles/brief", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              keyword: article.keyword,
              siteId,
            }),
          });

          if (!createRes.ok) {
            const data = await createRes.json();
            throw new Error(data.error || "Failed to create article");
          }

          const { articleId } = await createRes.json();

          // Step 2: Generate full content (outline, draft, SEO)
          const res = await fetch("/api/articles/generate-all", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              articleId,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to generate");
          }

          // Stream the response
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let completed = false;

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n').filter(l => l.trim());

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.slice(6).trim();
                    if (!jsonStr) continue; // Skip empty data
                    
                    const data = JSON.parse(jsonStr);
                    
                    if (data.done) {
                      completed = true;
                      setArticles(prev => prev.map((a, idx) =>
                        idx === index ? { ...a, status: 'done', articleId } : a
                      ));
                    }
                    
                    if (data.error) {
                      throw new Error(data.error);
                    }
                  } catch (parseError) {
                    // Skip malformed JSON chunks, they're likely incomplete
                    console.warn(`Skipping malformed chunk for article ${index + 1}:`, line.slice(6, 50));
                  }
                }
              }
            }
          }

          if (!completed) {
            throw new Error("Generation incomplete - stream ended without completion signal");
          }

          // Success - break retry loop
          break;

        } catch (error) {
          retries++;
          const errorMsg = error instanceof Error ? error.message : 'Failed';
          
          if (retries <= maxRetries) {
            // Retry after delay
            console.log(`Retrying article ${index + 1} (attempt ${retries + 1}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retries)); // Exponential backoff
          } else {
            // Max retries reached
            setArticles(prev => prev.map((a, idx) =>
              idx === index ? { ...a, status: 'error', error: `${errorMsg} (after ${maxRetries + 1} attempts)` } : a
            ));
          }
        }
      }
    });

    await Promise.all(promises);
    clearInterval(timerInterval);
    setTimeRemaining(0);
    setGenerating(false);
    
    const successCount = bulkArticles.filter((_, idx) => {
      const article = articles.find((a, i) => i === idx);
      return article?.status === 'done';
    }).length;
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Bulk Generation Complete!', {
        body: `${successCount} articles generated successfully`,
        icon: '/favicon.ico'
      });
    }
    
    toast.success(`Generated ${successCount} article${successCount !== 1 ? 's' : ''}!`);
  };

  const { plan: userPlanTier, isLoading: planLoading } = useUserPlan();

  // Debug: log the plan value
  console.log('Bulk page - User plan:', userPlanTier, 'Type:', typeof userPlanTier);

  // Show loading state while checking plan
  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  // Check if user has Pro plan (handle both string and object cases)
  const currentPlan = typeof userPlanTier === 'string' ? userPlanTier : userPlanTier?.id || userPlanTier?.planTier || 'free';
  
  if (currentPlan !== 'pro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Pro Feature</h1>
          <p className="text-muted-foreground mb-6">
            Bulk generation is available on the Pro plan. Generate up to 10 articles at once!
          </p>
          <Link href="/dashboard/settings?tab=billing" className="btn-gold">
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Link>
        
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-gold/30 p-6 mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gold/30 flex items-center justify-center relative backdrop-blur-sm">
                <Zap className="h-8 w-8 text-gold" />
                <Sparkles className="h-4 w-4 text-gold absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold">Bulk Generation</h1>
                  <PremiumBadge plan="pro" size="sm" />
                </div>
                <p className="text-muted-foreground">Generate up to 10 SEO-optimized articles simultaneously</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'generate'
                ? 'text-gold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            Generate
            {activeTab === 'generate' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('research')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'research'
                ? 'text-gold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-2" />
            Research & Import
            {activeTab === 'research' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'research' ? (
        <div className="space-y-6">
          {/* Bulk Import */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-gold" />
              <h2 className="text-lg font-semibold">Paste Keywords</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Paste your researched keywords (one per line, max 10)
            </p>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="best running shoes 2026&#10;how to train for marathon&#10;running tips for beginners"
              className="w-full h-40 px-4 py-3 rounded-lg border border-border bg-background font-mono text-sm"
            />
            <button
              onClick={handleBulkImport}
              disabled={!bulkInput.trim()}
              className="btn-gold mt-4"
            >
              Import Keywords
            </button>
          </div>

          {/* CSV Upload */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-gold" />
              <h2 className="text-lg font-semibold">Upload CSV</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file with keywords in the first column
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold/20 file:text-gold hover:file:bg-gold/30 cursor-pointer"
            />
          </div>

          {keywords.length > 1 || keywords[0] !== "" ? (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Imported Keywords</h3>
                <span className="text-sm text-muted-foreground">{keywords.length} keywords</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {keywords.map((kw, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background">
                    <span className="text-sm">{kw}</span>
                    <button
                      onClick={() => removeKeyword(i)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('generate')}
                className="btn-gold w-full mt-4"
              >
                Continue to Generate
              </button>
            </div>
          ) : null}
        </div>
      ) : articles.length === 0 ? (
        <div className="space-y-6">
          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-2xl font-bold text-gold">{keywords.filter(k => k.trim()).length}</div>
              <div className="text-sm text-muted-foreground">Articles</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-2xl font-bold text-teal">~{Math.ceil(keywords.filter(k => k.trim()).length * 3)} min</div>
              <div className="text-sm text-muted-foreground">Est. Time</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-2xl font-bold text-purple">{keywords.filter(k => k.trim()).length * wordCount}</div>
              <div className="text-sm text-muted-foreground">Total Words</div>
            </div>
          </div>

          {/* Site Selection */}
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="block text-sm font-medium mb-3">Select Site</label>
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background"
            >
              <option value="">Choose a site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.siteName}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Name */}
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="block text-sm font-medium mb-3">Batch Name (Optional)</label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g., Running Shoes Campaign"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background"
            />
            <p className="text-xs text-muted-foreground mt-2">Name this batch for easier tracking</p>
          </div>

          {/* Keywords */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Keywords ({keywords.length}/10)</label>
              <button
                onClick={() => setActiveTab('research')}
                className="text-sm text-gold hover:underline flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                Import
              </button>
            </div>
            <div className="space-y-2">
              {keywords.map((keyword, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => updateKeyword(index, e.target.value)}
                    placeholder={`Keyword ${index + 1}`}
                    className="flex-1 px-4 py-3 rounded-lg border border-border bg-background"
                  />
                  {keywords.length > 1 && (
                    <button
                      onClick={() => removeKeyword(index)}
                      className="p-3 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {keywords.length < 10 && (
              <button
                onClick={addKeyword}
                className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Add keyword
              </button>
            )}
          </div>

          {/* Advanced Options */}
          <div className="rounded-xl border border-border bg-card">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-6"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-gold" />
                <span className="font-medium">Advanced Options</span>
              </div>
              <span className="text-muted-foreground">{showAdvanced ? '−' : '+'}</span>
            </button>
            {showAdvanced && (
              <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Word Count</label>
                  <input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    min={500}
                    max={3000}
                    step={100}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recommended: 1500-2000 words</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              handleGenerate();
              requestNotificationPermission();
            }}
            disabled={generating || !siteId}
            className="btn-gold w-full py-4 text-lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Generate {keywords.filter(k => k.trim()).length} Articles
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{batchName || 'Bulk Generation'}</h2>
                {generating && timeRemaining > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Estimated time remaining: {formatTime(timeRemaining)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gold">
                  {articles.filter(a => a.status === 'done').length}/{articles.length}
                </div>
                <span className="text-sm text-muted-foreground">complete</span>
              </div>
            </div>
            <div className="w-full bg-border rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-teal transition-all duration-500"
                style={{ width: `${(articles.filter(a => a.status === 'done').length / articles.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Articles List */}
          <div className="space-y-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex items-center justify-between p-5 rounded-xl border border-border bg-card hover:border-gold/30 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {article.status === 'pending' && (
                    <div className="h-10 w-10 rounded-full border-2 border-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">•••</span>
                    </div>
                  )}
                  {article.status === 'generating' && (
                    <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-gold animate-spin" />
                    </div>
                  )}
                  {article.status === 'done' && (
                    <div className="h-10 w-10 rounded-full bg-teal/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-teal" />
                    </div>
                  )}
                  {article.status === 'error' && (
                    <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{article.keyword}</p>
                    {article.status === 'generating' && (
                      <p className="text-xs text-muted-foreground">Generating SEO brief...</p>
                    )}
                    {article.error && (
                      <p className="text-xs text-destructive">{article.error}</p>
                    )}
                  </div>
                </div>
                {article.articleId && (
                  <Link
                    href={`/dashboard/articles/${article.articleId}`}
                    className="px-4 py-2 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 text-sm font-medium transition-colors"
                  >
                    View Article
                  </Link>
                )}
              </div>
            ))}
          </div>

          {!generating && (
            <div className="flex gap-3">
              <button
                onClick={downloadResults}
                disabled={articles.filter(a => a.articleId).length === 0}
                className="flex-1 px-6 py-4 rounded-xl border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-5 w-5 inline mr-2" />
                Download Results CSV
              </button>
              <button
                onClick={() => {
                  setArticles([]);
                  setKeywords([""]);
                  setBatchName("");
                }}
                className="btn-gold flex-1 py-4"
              >
                <Plus className="h-5 w-5" />
                Generate More Articles
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
