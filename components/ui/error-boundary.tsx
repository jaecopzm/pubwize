"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-obsidian">
          <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-1">Something went wrong</h2>
                <p className="text-sm text-text-3">We're sorry for the inconvenience</p>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-4 p-3 rounded-lg bg-surface-2 border border-border">
                <p className="text-xs font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500 text-white px-4 py-3 text-sm font-semibold hover:bg-red-600 transition-all active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>

            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border border-border bg-card text-text-2 px-4 py-3 text-sm font-semibold hover:bg-muted transition-all active:scale-95"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
