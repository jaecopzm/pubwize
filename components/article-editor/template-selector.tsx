"use client";

import { useState } from "react";
import { FileText, CheckCircle2, Zap, List, ShoppingCart, BookOpen, X } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  structure: string[];
  useCase: string;
}

interface TemplateSelectorProps {
  keyword: string;
  onTemplateSelect: (outline: any) => void;
  onClose: () => void;
}

const templates: Template[] = [
  {
    id: "product-review",
    name: "Product Review",
    description: "Comprehensive product review with pros, cons, and verdict",
    icon: CheckCircle2,
    color: "teal",
    structure: [
      "Introduction",
      "What is [Product]?",
      "Key Features",
      "Pros and Cons",
      "Who Should Buy This?",
      "Alternatives to Consider",
      "Final Verdict",
      "FAQ"
    ],
    useCase: "Best for reviewing products, tools, or services"
  },
  {
    id: "comparison",
    name: "Comparison Article",
    description: "Side-by-side comparison of products or services",
    icon: Zap,
    color: "gold",
    structure: [
      "Introduction",
      "Quick Comparison Table",
      "[Option 1] Overview",
      "[Option 2] Overview",
      "Feature Comparison",
      "Pricing Comparison",
      "Which One Should You Choose?",
      "FAQ"
    ],
    useCase: "Best for comparing 2-3 products or services"
  },
  {
    id: "how-to-guide",
    name: "How-To Guide",
    description: "Step-by-step tutorial with clear instructions",
    icon: List,
    color: "lilac",
    structure: [
      "Introduction",
      "What You'll Need",
      "Step 1: [First Step]",
      "Step 2: [Second Step]",
      "Step 3: [Third Step]",
      "Common Mistakes to Avoid",
      "Tips for Success",
      "FAQ"
    ],
    useCase: "Best for tutorials and instructional content"
  },
  {
    id: "buying-guide",
    name: "Buying Guide",
    description: "Help readers make informed purchase decisions",
    icon: ShoppingCart,
    color: "gold",
    structure: [
      "Introduction",
      "Why You Need [Product Category]",
      "Key Factors to Consider",
      "Top [Number] Options",
      "Budget Options",
      "Premium Options",
      "How to Choose the Right One",
      "FAQ"
    ],
    useCase: "Best for helping readers choose products"
  },
  {
    id: "listicle",
    name: "Listicle",
    description: "Numbered list of items, tips, or recommendations",
    icon: List,
    color: "teal",
    structure: [
      "Introduction",
      "1. [First Item]",
      "2. [Second Item]",
      "3. [Third Item]",
      "4. [Fourth Item]",
      "5. [Fifth Item]",
      "Conclusion",
      "FAQ"
    ],
    useCase: "Best for top lists and curated collections"
  },
  {
    id: "ultimate-guide",
    name: "Ultimate Guide",
    description: "Comprehensive, in-depth guide on a topic",
    icon: BookOpen,
    color: "lilac",
    structure: [
      "Introduction",
      "What is [Topic]?",
      "Why [Topic] Matters",
      "Getting Started",
      "Advanced Techniques",
      "Common Challenges",
      "Best Practices",
      "Tools and Resources",
      "Conclusion",
      "FAQ"
    ],
    useCase: "Best for comprehensive, authoritative content"
  }
];

export function TemplateSelector({ keyword, onTemplateSelect, onClose }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleSelectTemplate = async (template: Template) => {
    setSelectedTemplate(template.id);
    setGenerating(true);

    try {
      const response = await fetch('/api/articles/apply-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          keyword,
          structure: template.structure,
        }),
      });

      if (!response.ok) throw new Error('Failed to apply template');

      const data = await response.json();
      onTemplateSelect(data.outline);
      toast.success(`${template.name} template applied!`);
      onClose();
    } catch (error) {
      toast.error('Failed to apply template');
      setSelectedTemplate(null);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-surface-1 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-text-1 font-display">
              Choose a Template
            </h2>
            <p className="text-xs sm:text-sm text-text-3 mt-1">
              Start with a proven structure for your article type
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-text-3 p-1 hover:bg-white/5 rounded active:scale-95 touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {templates.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate === template.id;
            const isGenerating = generating && isSelected;

            return (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                disabled={generating}
                className={`group relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden ${
                  template.color === 'gold'
                    ? 'border-gold/30 bg-gold/5 hover:bg-gold/10 hover:border-gold/50 hover:shadow-gold/20'
                    : template.color === 'teal'
                    ? 'border-teal/30 bg-teal/5 hover:bg-teal/10 hover:border-teal/50 hover:shadow-teal/20'
                    : 'border-lilac/30 bg-lilac/5 hover:bg-lilac/10 hover:border-lilac/50 hover:shadow-lilac/20'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 opacity-5 ${
                  template.color === 'gold'
                    ? 'from-gold to-gold-dim'
                    : template.color === 'teal'
                    ? 'from-teal to-teal'
                    : 'from-lilac to-lilac'
                }`} />
                
                <div className="flex items-center gap-2 w-full relative z-10">
                  <div className={`p-2 rounded-lg ${
                    template.color === 'gold'
                      ? 'bg-gold/20'
                      : template.color === 'teal'
                      ? 'bg-teal/20'
                      : 'bg-lilac/20'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      template.color === 'gold'
                        ? 'text-gold'
                        : template.color === 'teal'
                        ? 'text-teal'
                        : 'text-lilac'
                    }`} />
                  </div>
                  <h3 className="text-sm font-bold text-text-1 flex-1">
                    {template.name}
                  </h3>
                </div>

                <p className="text-xs text-text-2 relative z-10">
                  {template.description}
                </p>

                <div className="text-[10px] text-text-3 relative z-10">
                  {template.useCase}
                </div>

                <div className="text-[10px] font-mono-dm text-text-3 relative z-10">
                  {template.structure.length} sections
                </div>

                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-1/80 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                      <span className="text-xs font-semibold text-text-1">Generating...</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-xl border border-gold/20 bg-gold/5">
          <p className="text-xs text-text-3">
            <strong className="text-text-1">Tip:</strong> Templates provide a proven structure, but you can always customize the outline after applying it.
          </p>
        </div>
      </div>
    </div>
  );
}
