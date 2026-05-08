/**
 * Shared utilities for cleaning and formatting AI-generated markdown.
 */

/**
 * Removes common AI-generated artifacts like markdown code fences.
 */
export function cleanMarkdown(content: string): string {
  let cleaned = content.trim();
  
  // Remove markdown code fences if they wrap the entire content
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
  }
  
  // Remove extra whitespace/multiple consecutive newlines that AI sometimes produces
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
}

/**
 * Ensures exactly one blank line between sections and paragraphs.
 */
export function normalizeSpacing(content: string): string {
  return content
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts a specific markdown section by heading if needed.
 */
export function extractSection(content: string, heading: string): string | null {
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines: string[] = [];
  
  const headingRegex = new RegExp(`^#+\\s+${heading}`, 'i');
  
  for (const line of lines) {
    if (headingRegex.test(line)) {
      inSection = true;
      continue;
    }
    
    if (inSection) {
      if (line.startsWith('#')) break;
      sectionLines.push(line);
    }
  }
  
  return sectionLines.length > 0 ? sectionLines.join('\n').trim() : null;
}
