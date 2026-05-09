"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Hash, Copy, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { GenerateCTA } from "./generate-cta";
import type { SocialMediaData } from "@/lib/types";

// Modern SVG Social Icons
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

interface SocialPanelProps {
  socialMedia: SocialMediaData | null;
  articleId: string;
  keyword: string;
  content: string;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function SocialPanel({ socialMedia, articleId, keyword, content, onGenerate, isGenerating }: SocialPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!socialMedia) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
            <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ready to Amplify Your Reach
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
            Generate platform-optimized social media posts from your article content in seconds.
          </p>
          <GenerateCTA
            onClick={onGenerate}
            loading={isGenerating}
            done={false}
            label="Generate Social Media Posts"
            doneLabel="Social media posts generated"
          />
        </div>
      </div>
    );
  }

  const platforms = [
    { key: 'twitter', label: '', icon: TwitterIcon, color: 'text-black dark:text-white', bgColor: 'bg-black/5 dark:bg-white/5', posts: socialMedia.twitter },
    { key: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon, color: 'text-[#0A66C2]', bgColor: 'bg-[#0A66C2]/10', posts: socialMedia.linkedin },
    { key: 'instagram', label: 'Instagram', icon: InstagramIcon, color: 'text-[#E4405F]', bgColor: 'bg-[#E4405F]/10', posts: socialMedia.instagram },
    { key: 'facebook', label: 'Facebook', icon: FacebookIcon, color: 'text-[#1877F2]', bgColor: 'bg-[#1877F2]/10', posts: socialMedia.facebook },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Social Media Content</h2>
          <p className="text-sm text-gray-600">Platform-optimized posts</p>
        </div>
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating} 
          variant="outline"
          size="sm"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Regenerate
        </Button>
      </div>

      <Tabs defaultValue="twitter" className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-1 h-auto p-1 bg-transparent border-b border-border">
          {platforms.map(platform => {
            const Icon = platform.icon;
            return (
              <TabsTrigger 
                key={platform.key} 
                value={platform.key} 
                className="flex items-center justify-center gap-2 py-2 px-2 rounded-xl border border-transparent data-[state=active]:border-border data-[state=active]:bg-card transition-all"
              >
                <div className={`w-5 h-5 ${platform.color}`}>
                  <Icon />
                </div>
                {platform.label && <span className="hidden sm:inline text-sm">{platform.label}</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {platforms.map(platform => (
          <TabsContent key={platform.key} value={platform.key} className="space-y-3 mt-4">
            <div className="grid gap-3">
              {platform.posts.map((post, index) => (
                <Card key={index} className="overflow-hidden border-border bg-card hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 px-4 pt-3 bg-gradient-to-r from-transparent to-transparent hover:from-muted/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <div className={`w-4 h-4 ${platform.color}`}>
                          <platform.icon />
                        </div>
                        <span>Post {index + 1}</span>
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-muted"
                        onClick={() => copyToClipboard(post, `${platform.key}-${index}`)}
                      >
                        {copiedIndex === `${platform.key}-${index}` ? (
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 sm:px-5 pb-3 sm:pb-4">
                    <Textarea
                      value={post}
                      readOnly
                      className="min-h-[100px] resize-none text-xs sm:text-sm border-0 bg-muted/50 p-3 sm:p-4 focus:ring-0 focus:outline-none rounded-lg"
                    />
                    <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-0 text-xs">
                      <div className="text-muted-foreground font-medium">
                        {post.length} characters
                      </div>
                      {platform.key === 'twitter' && (
                        <div className={`font-semibold ${post.length > 280 ? 'text-destructive' : 'text-teal'}`}>
                          {280 - post.length} remaining
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {socialMedia.hashtags.length > 0 && (
        <Card className="border-border bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-3 px-5 pt-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-5 h-5 text-gold">
                <Hash className="w-full h-full" />
              </div>
              Trending Hashtags
            </CardTitle>
            <CardDescription className="text-xs">
              Click any hashtag to copy
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex flex-wrap gap-2">
              {socialMedia.hashtags.map((hashtag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-gold/20 hover:text-gold hover:border-gold/30 text-xs px-3 py-1.5 transition-all border border-border"
                  onClick={() => copyToClipboard(hashtag, `hashtag-${index}`)}
                >
                  {hashtag}
                  {copiedIndex === `hashtag-${index}` && (
                    <Check className="w-3 h-3 ml-1.5 text-teal" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
