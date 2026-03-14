"use client";

import { useState } from 'react';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { VersionSnapshot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface VersionDiffViewerProps {
  currentSnapshot: VersionSnapshot;
  previousSnapshot?: VersionSnapshot;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
}

export function VersionDiffViewer({
  currentSnapshot,
  previousSnapshot,
  onNavigate,
  canNavigatePrev = false,
  canNavigateNext = false,
}: VersionDiffViewerProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'outline' | 'draft'>('draft');
  
  const currentDate = new Date(currentSnapshot.timestamp.seconds * 1000);
  const previousDate = previousSnapshot 
    ? new Date(previousSnapshot.timestamp.seconds * 1000)
    : null;

  // Determine which tabs to show based on available content
  const availableTabs: Array<'brief' | 'outline' | 'draft'> = [];
  if (currentSnapshot.snapshot.brief) availableTabs.push('brief');
  if (currentSnapshot.snapshot.outline) availableTabs.push('outline');
  if (currentSnapshot.snapshot.draft) availableTabs.push('draft');

  // Set initial active tab to the first available
  if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
    setActiveTab(availableTabs[0]);
  }

  function renderBriefContent(snapshot: VersionSnapshot) {
    const brief = snapshot.snapshot.brief;
    if (!brief) return <p className="text-sm text-muted-foreground">No brief content</p>;

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Intent & Type</h4>
          <p className="text-sm"><span className="font-medium">Intent:</span> {brief.intent}</p>
          <p className="text-sm"><span className="font-medium">Type:</span> {brief.articleType}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Headings ({brief.headings.length})</h4>
          <ul className="list-disc list-inside space-y-1">
            {brief.headings.map((heading, i) => (
              <li key={i} className="text-sm">{heading}</li>
            ))}
          </ul>
        </div>

        {brief.questions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Questions ({brief.questions.length})</h4>
            <ul className="list-disc list-inside space-y-1">
              {brief.questions.map((q, i) => (
                <li key={i} className="text-sm">{q}</li>
              ))}
            </ul>
          </div>
        )}

        {brief.entities.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Entities</h4>
            <div className="flex flex-wrap gap-2">
              {brief.entities.map((entity, i) => (
                <span key={i} className="px-2 py-1 bg-muted rounded text-xs">
                  {entity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderOutlineContent(snapshot: VersionSnapshot) {
    const outline = snapshot.snapshot.outline;
    if (!outline) return <p className="text-sm text-muted-foreground">No outline content</p>;

    return (
      <div className="space-y-3">
        {outline.sections.map((section, i) => (
          <div key={i} className="border-l-2 border-violet-500 pl-4">
            <h4 className="text-sm font-semibold">{section.heading}</h4>
            {section.notes && (
              <p className="text-sm text-muted-foreground mt-1">{section.notes}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderDraftContent(snapshot: VersionSnapshot) {
    const draft = snapshot.snapshot.draft;
    if (!draft) return <p className="text-sm text-muted-foreground">No draft content</p>;

    const wordCount = draft.content.split(/\s+/).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Format: {draft.format}</span>
          <span>Words: {wordCount.toLocaleString()}</span>
        </div>
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded">
            {draft.content}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-lg font-semibold">Version Details</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(currentDate, { addSuffix: true })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate?.('prev')}
            disabled={!canNavigatePrev}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate?.('next')}
            disabled={!canNavigateNext}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Version info */}
      <div className="p-4 bg-muted/30 border-b">
        <p className="text-sm font-medium">{currentSnapshot.changeDescription}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span className="capitalize">{currentSnapshot.contentType}</span>
        </div>
      </div>

      {/* Content tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          {availableTabs.includes('brief') && (
            <TabsTrigger value="brief">Brief</TabsTrigger>
          )}
          {availableTabs.includes('outline') && (
            <TabsTrigger value="outline">Outline</TabsTrigger>
          )}
          {availableTabs.includes('draft') && (
            <TabsTrigger value="draft">Draft</TabsTrigger>
          )}
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="brief" className="mt-0">
              {previousSnapshot ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                      Previous Version
                    </h4>
                    {renderBriefContent(previousSnapshot)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-violet-400">
                      Current Version
                    </h4>
                    {renderBriefContent(currentSnapshot)}
                  </div>
                </div>
              ) : (
                renderBriefContent(currentSnapshot)
              )}
            </TabsContent>

            <TabsContent value="outline" className="mt-0">
              {previousSnapshot ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                      Previous Version
                    </h4>
                    {renderOutlineContent(previousSnapshot)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-violet-400">
                      Current Version
                    </h4>
                    {renderOutlineContent(currentSnapshot)}
                  </div>
                </div>
              ) : (
                renderOutlineContent(currentSnapshot)
              )}
            </TabsContent>

            <TabsContent value="draft" className="mt-0">
              {previousSnapshot ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                      Previous Version
                    </h4>
                    {renderDraftContent(previousSnapshot)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-violet-400">
                      Current Version
                    </h4>
                    {renderDraftContent(currentSnapshot)}
                  </div>
                </div>
              ) : (
                renderDraftContent(currentSnapshot)
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
