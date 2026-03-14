"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Globe, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/hooks/use-auth";
import type { WordPressSite } from "@/lib/types";

interface WordPressSitesListProps {
  sites: WordPressSite[];
  onSitesChange?: () => void;
}

export function WordPressSitesList({
  sites,
  onSitesChange,
}: WordPressSitesListProps) {
  const [siteToDelete, setSiteToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [faviconErrors, setFaviconErrors] = React.useState<Set<string>>(new Set());

  const getFaviconUrl = (siteUrl: string) => {
    try {
      const url = new URL(siteUrl);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
    } catch {
      return null;
    }
  };

  const handleFaviconError = (siteId: string) => {
    setFaviconErrors(prev => new Set(prev).add(siteId));
  };

  const handleDisconnect = async (siteId: string) => {
    setIsDeleting(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/wordpress/sites/${siteId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect site");
      }

      toast.success("WordPress site disconnected");
      onSitesChange?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect site"
      );
    } finally {
      setIsDeleting(false);
      setSiteToDelete(null);
    }
  };

  if (sites.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No WordPress sites connected</p>
            <p className="text-sm mt-2">
              Connect a site to enable one-click publishing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sites.map((site) => (
          <Card key={site.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                    {!faviconErrors.has(site.id) && getFaviconUrl(site.siteUrl) ? (
                      <Image
                        src={getFaviconUrl(site.siteUrl)!}
                        alt={`${site.siteName} favicon`}
                        width={32}
                        height={32}
                        className="object-contain"
                        onError={() => handleFaviconError(site.id)}
                      />
                    ) : (
                      <Globe className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{site.siteName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {site.siteUrl}
                    </p>
                  </div>
                </div>
                {site.connected && (
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-600 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {site.lastPublished && (
                    <p>
                      Last published:{" "}
                      {new Date(
                        site.lastPublished.seconds * 1000
                      ).toLocaleDateString()}
                    </p>
                  )}
                  {!site.lastPublished && <p>No articles published yet</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSiteToDelete(site.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog
        open={siteToDelete !== null}
        onOpenChange={(open) => !open && setSiteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect WordPress Site?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to your WordPress site. You can
              reconnect it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => siteToDelete && handleDisconnect(siteToDelete)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Disconnecting..." : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
