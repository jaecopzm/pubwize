"use client";

import { useEffect, useState } from "react";
import { List, X } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const headingData: Heading[] = [];

    elements.forEach((el) => {
      if (!el.id) {
        el.id = el.textContent?.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || "";
      }
      headingData.push({
        id: el.id,
        text: el.textContent || "",
        level: parseInt(el.tagName[1]),
      });
    });

    setHeadings(headingData);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-gold text-obsidian shadow-lg hover:bg-gold/90 transition-all flex items-center justify-center"
      >
        {isOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div
            className="fixed bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-mono-dm text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              On This Page
            </h3>
            <nav>
              <ul className="space-y-1">
                {headings.map((heading) => (
                  <li key={heading.id} style={{ paddingLeft: heading.level === 3 ? "1rem" : 0 }}>
                    <a
                      href={`#${heading.id}`}
                      className={`
                        group relative block text-sm transition-all py-2 pl-3
                        ${activeId === heading.id
                          ? "text-gold font-semibold"
                          : "text-muted-foreground"
                        }
                      `}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" });
                        setIsOpen(false);
                      }}
                    >
                      {/* Active indicator bar */}
                      <span className={`
                        absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full transition-all duration-200
                        ${activeId === heading.id
                          ? "bg-gold opacity-100"
                          : "bg-transparent opacity-0"
                        }
                      `} />
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
