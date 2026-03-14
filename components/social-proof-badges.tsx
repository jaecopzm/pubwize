"use client";

import { Users, Star, TrendingUp, Zap } from "lucide-react";

export function SocialProofBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4">
      <div className="flex items-center gap-2 text-sm">
        <div className="h-8 w-8 rounded-full bg-teal/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-teal" />
        </div>
        <div>
          <div className="font-bold text-foreground">500+</div>
          <div className="text-xs text-muted-foreground">Active Users</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
          <Star className="h-4 w-4 text-gold" />
        </div>
        <div>
          <div className="font-bold text-foreground">4.9/5</div>
          <div className="text-xs text-muted-foreground">Rating</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="h-8 w-8 rounded-full bg-lilac/20 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-lilac" />
        </div>
        <div>
          <div className="font-bold text-foreground">10K+</div>
          <div className="text-xs text-muted-foreground">Articles Created</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center">
          <Zap className="h-4 w-4 text-gold" />
        </div>
        <div>
          <div className="font-bold text-foreground">4 hours</div>
          <div className="text-xs text-muted-foreground">Avg. Time Saved</div>
        </div>
      </div>
    </div>
  );
}
