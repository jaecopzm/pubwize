"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Icon */}
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                variant === "danger" 
                  ? "bg-destructive/10 text-destructive" 
                  : "bg-amber-500/10 text-amber-500"
              }`}>
                <AlertTriangle className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {description}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  variant="destructive"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Deleting..." : confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
