export interface ImageWithAlt {
  alt: string;
  url: string;
}

export interface ImageWithoutAlt {
  url: string;
  position: number;
}

const IMG_MD_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

export function extractImages(markdown: string): ImageWithAlt[] {
  const images: ImageWithAlt[] = [];
  let match: RegExpExecArray | null;
  while ((match = IMG_MD_REGEX.exec(markdown)) !== null) {
    images.push({ alt: match[1], url: match[2] });
  }
  return images;
}

export function findImagesWithoutAlt(markdown: string): ImageWithoutAlt[] {
  const images = extractImages(markdown);
  return images
    .filter((img) => !img.alt || img.alt === "Image")
    .map((img, i) => ({ url: img.url, position: i }));
}

export function generateAltText(keyword: string, context: string): string {
  const maxContext = context.replace(/[#*_~\[\](){}>`|]/g, "").trim().slice(0, 100);
  return `${keyword} - ${maxContext}`;
}

export function autoFillAltText(markdown: string, keyword: string): string {
  const contextLines = markdown.split("\n");
  const result: string[] = [];
  let lineBuffer = "";

  for (const line of contextLines) {
    const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (match) {
      const alt = match[1];
      if (!alt || alt === "Image") {
        lineBuffer += `![${keyword}](${match[2]})`;
      } else {
        lineBuffer += line;
      }
    } else {
      lineBuffer += line;
    }
    result.push(lineBuffer);
    lineBuffer = "";
  }

  return result.join("\n");
}
