import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from "dompurify"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - The string to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string | undefined): string {
  if (!input) return ""

  // Configure DOMPurify to strip all HTML tags and scripts
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  })

  return clean.trim()
}

/**
 * Sanitize a URL to ensure it's safe
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | undefined): string {
  if (!url) return ""

  const trimmed = url.trim()

  // Only allow http and https protocols
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return ""
    }
    return DOMPurify.sanitize(trimmed, { ALLOWED_URI_REGEXP: /^(?:https?):/ })
  } catch {
    // If URL is invalid, return empty string
    return ""
  }
}
