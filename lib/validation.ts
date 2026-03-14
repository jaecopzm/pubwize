/**
 * Input Validation Utilities
 * Provides consistent validation across the application
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate keyword/query input
 */
export function validateKeyword(keyword: string): ValidationResult {
  if (!keyword || typeof keyword !== "string") {
    return { valid: false, error: "Keyword is required" };
  }

  const trimmed = keyword.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: "Keyword must be at least 2 characters" };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: "Keyword is too long (max 200 characters)" };
  }

  // Check for suspicious patterns
  if (/<script|javascript:|onerror=/i.test(trimmed)) {
    return { valid: false, error: "Invalid keyword format" };
  }

  return { valid: true };
}

/**
 * Validate article content
 */
export function validateContent(content: string): ValidationResult {
  if (!content || typeof content !== "string") {
    return { valid: false, error: "Content is required" };
  }

  const trimmed = content.trim();

  if (trimmed.length < 10) {
    return { valid: false, error: "Content is too short (min 10 characters)" };
  }

  if (trimmed.length > 100000) {
    return { valid: false, error: "Content is too long (max 100,000 characters)" };
  }

  return { valid: true };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required" };
  }

  try {
    const parsed = new URL(url);
    
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
    }

    if (parsed.hostname.length < 3) {
      return { valid: false, error: "Invalid URL hostname" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  if (email.length > 254) {
    return { valid: false, error: "Email is too long" };
  }

  return { valid: true };
}

/**
 * Validate WordPress credentials
 */
export function validateWordPressCredentials(data: {
  siteUrl?: string;
  username?: string;
  password?: string;
}): ValidationResult {
  const urlValidation = validateUrl(data.siteUrl || "");
  if (!urlValidation.valid) {
    return urlValidation;
  }

  if (!data.username || data.username.trim().length < 2) {
    return { valid: false, error: "Username must be at least 2 characters" };
  }

  if (!data.password || data.password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  return { valid: true };
}

/**
 * Validate article ID format
 */
export function validateArticleId(id: string): ValidationResult {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "Article ID is required" };
  }

  // Firestore document IDs are alphanumeric
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { valid: false, error: "Invalid article ID format" };
  }

  if (id.length < 10 || id.length > 100) {
    return { valid: false, error: "Invalid article ID length" };
  }

  return { valid: true };
}

/**
 * Validate word count target
 */
export function validateWordCount(count: number): ValidationResult {
  if (typeof count !== "number" || isNaN(count)) {
    return { valid: false, error: "Word count must be a number" };
  }

  if (count < 100) {
    return { valid: false, error: "Word count must be at least 100" };
  }

  if (count > 10000) {
    return { valid: false, error: "Word count cannot exceed 10,000" };
  }

  return { valid: true };
}

/**
 * Sanitize HTML (basic XSS prevention)
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/onerror=/gi, "")
    .replace(/onclick=/gi, "")
    .replace(/onload=/gi, "");
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): ValidationResult {
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
  const allowedTypes = options.allowedTypes || ["image/jpeg", "image/png", "image/webp"];

  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(", ")}` };
  }

  return { valid: true };
}

/**
 * Batch validation
 */
export function validateBatch<T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, (value: any) => ValidationResult>
): { valid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let valid = true;

  for (const [key, validator] of Object.entries(validators)) {
    const result = validator(data[key as keyof T]);
    if (!result.valid) {
      errors[key as keyof T] = result.error;
      valid = false;
    }
  }

  return { valid, errors };
}
