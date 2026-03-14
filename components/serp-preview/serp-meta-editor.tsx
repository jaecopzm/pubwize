"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SERPCharacterCounter } from "./serp-character-counter";
import { SERP_LIMITS } from "@/lib/serp-preview";

interface SERPMetaEditorProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function SERPMetaEditor({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: SERPMetaEditorProps) {
  return (
    <div className="space-y-4">
      {/* Title Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meta-title">Meta Title</Label>
          <SERPCharacterCounter
            count={title?.length || 0}
            limit={SERP_LIMITS.TITLE_MAX}
            label="Characters"
          />
        </div>
        <Input
          id="meta-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter your page title..."
          className="w-full"
        />
      </div>

      {/* Description Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meta-description">Meta Description</Label>
          <SERPCharacterCounter
            count={description?.length || 0}
            limit={SERP_LIMITS.DESCRIPTION_MAX}
            label="Characters"
          />
        </div>
        <Textarea
          id="meta-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter your page description..."
          className="w-full min-h-[80px] resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}
