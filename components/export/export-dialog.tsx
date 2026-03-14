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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, FileCode, Download } from "lucide-react";
import {
  exportToHTML,
  exportToMarkdown,
  downloadFile,
  type ArticleExportData,
  type ExportOptions,
} from "@/lib/export";
import { toast } from "sonner";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: ArticleExportData;
}

type ExportFormat = "html" | "markdown";

export function ExportDialog({
  open,
  onOpenChange,
  article,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] =
    React.useState<ExportFormat>("markdown");
  const [includeImages, setIncludeImages] = React.useState(true);
  const [includeMetadata, setIncludeMetadata] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);

  const formats = [
    {
      id: "markdown" as const,
      name: "Markdown",
      description: "Plain text with formatting syntax",
      icon: FileText,
    },
    {
      id: "html" as const,
      name: "HTML",
      description: "Standalone HTML file with embedded CSS",
      icon: FileCode,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const options: ExportOptions = {
        includeImages,
        includeMetadata,
      };

      let result: { content: string; filename: string };

      switch (selectedFormat) {
        case "html":
          result = exportToHTML(article, options);
          downloadFile(result.content, result.filename, "text/html");
          break;
        case "markdown":
          result = exportToMarkdown(article, options);
          downloadFile(result.content, result.filename, "text/markdown");
          break;
      }

      toast.success(`Article exported as ${selectedFormat.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export article");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Article</DialogTitle>
          <DialogDescription>
            Choose a format and options to export your article
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid gap-3">
              {formats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedFormat === format.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{format.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-images"
                  checked={includeImages}
                  onCheckedChange={(checked) =>
                    setIncludeImages(checked as boolean)
                  }
                />
                <Label
                  htmlFor="include-images"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include images
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) =>
                    setIncludeMetadata(checked as boolean)
                  }
                />
                <Label
                  htmlFor="include-metadata"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include metadata (author, date)
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
