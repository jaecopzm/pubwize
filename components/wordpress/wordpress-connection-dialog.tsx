"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/hooks/use-auth";

interface WordPressConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WordPressConnectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: WordPressConnectionDialogProps) {
  const [siteUrl, setSiteUrl] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isValidating, setIsValidating] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = React.useState(false);

  const handleValidate = async () => {
    setError(null);
    setValidationSuccess(false);

    if (!siteUrl || !username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsValidating(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/wordpress/validate", {
        method: "POST",
        headers,
        body: JSON.stringify({ siteUrl, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to validate credentials");
        return;
      }

      setValidationSuccess(true);
      toast.success("Credentials validated successfully!");
    } catch (err) {
      setError("Failed to connect to WordPress site");
    } finally {
      setIsValidating(false);
    }
  };

  const handleConnect = async () => {
    if (!validationSuccess) {
      setError("Please validate credentials first");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch("/api/wordpress/sites", {
        method: "POST",
        headers,
        body: JSON.stringify({ siteUrl, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to connect site");
        return;
      }

      toast.success(`Connected to ${data.siteName}`);
      onSuccess?.();
      onOpenChange(false);

      // Reset form
      setSiteUrl("");
      setUsername("");
      setPassword("");
      setValidationSuccess(false);
    } catch (err) {
      setError("Failed to connect WordPress site");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect WordPress Site</DialogTitle>
          <DialogDescription>
            Enter your WordPress site details to enable one-click publishing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Site URL */}
          <div className="space-y-2">
            <Label htmlFor="site-url">Site URL</Label>
            <Input
              id="site-url"
              placeholder="https://yoursite.com"
              value={siteUrl}
              onChange={(e) => {
                setSiteUrl(e.target.value);
                setValidationSuccess(false);
              }}
              disabled={isValidating || isConnecting}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">WordPress Username</Label>
            <Input
              id="username"
              placeholder="admin"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setValidationSuccess(false);
              }}
              disabled={isValidating || isConnecting}
            />
            <p className="text-xs text-muted-foreground">
              Your WordPress username (not email address)
            </p>
          </div>

          {/* Application Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Application Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationSuccess(false);
              }}
              disabled={isValidating || isConnecting}
            />
            <p className="text-xs text-muted-foreground">
              Not your regular password. Generate at:{" "}
              <a
                href={siteUrl ? `${siteUrl.replace(/\/$/, '')}/wp-admin/profile.php` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline font-medium"
              >
                WordPress → Users → Profile → Application Passwords
              </a>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {validationSuccess && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                Credentials validated! Click "Connect" to save this site.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isValidating || isConnecting}
          >
            Cancel
          </Button>
          {!validationSuccess ? (
            <Button
              onClick={handleValidate}
              disabled={isValidating || !siteUrl || !username || !password}
            >
              {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Validate
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Connect
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
