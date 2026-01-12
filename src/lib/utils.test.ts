import { describe, it, expect } from 'vitest';
import { cn, sanitizeInput, sanitizeUrl } from './utils';

describe('Utils functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500');
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('px-4', false && 'py-2', true && 'bg-blue-500');
      expect(result).toBe('px-4 bg-blue-500');
    });

    it('should merge conflicting Tailwind classes correctly', () => {
      const result = cn('px-4', 'px-6');
      // tailwind-merge should keep the last one
      expect(result).toBe('px-6');
    });
  });

  describe('sanitizeInput', () => {
    it('should return empty string for undefined input', () => {
      const result = sanitizeInput(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for empty input', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('should preserve plain text', () => {
      const result = sanitizeInput('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should remove HTML tags', () => {
      const result = sanitizeInput('<script>alert("XSS")</script>Hello');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toContain('Hello');
    });

    it('should remove dangerous scripts', () => {
      const result = sanitizeInput('<img src=x onerror=alert("XSS")>');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should strip all HTML but keep content', () => {
      const result = sanitizeInput('<b>Bold</b> and <i>italic</i>');
      expect(result).toBe('Bold and italic');
    });

    it('should handle special characters safely', () => {
      const result = sanitizeInput('Test & < > " \'');
      expect(result).toBeTruthy();
      // DOMPurify should handle these safely
    });

    it('should trim whitespace', () => {
      const result = sanitizeInput('  Hello World  ');
      expect(result).toBe('Hello World');
    });
  });

  describe('sanitizeUrl', () => {
    it('should return empty string for undefined', () => {
      const result = sanitizeUrl(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for empty string', () => {
      const result = sanitizeUrl('');
      expect(result).toBe('');
    });

    it('should accept valid HTTPS URLs', () => {
      const url = 'https://example.com';
      const result = sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('should accept valid HTTP URLs', () => {
      const url = 'http://example.com';
      const result = sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('should reject javascript: protocol', () => {
      const result = sanitizeUrl('javascript:alert("XSS")');
      expect(result).toBe('');
    });

    it('should reject data: protocol', () => {
      const result = sanitizeUrl('data:text/html,<script>alert("XSS")</script>');
      expect(result).toBe('');
    });

    it('should reject file: protocol', () => {
      const result = sanitizeUrl('file:///etc/passwd');
      expect(result).toBe('');
    });

    it('should handle URLs with query parameters', () => {
      const url = 'https://example.com?param=value&foo=bar';
      const result = sanitizeUrl(url);
      expect(result).toContain('example.com');
    });

    it('should handle URLs with hash', () => {
      const url = 'https://example.com#section';
      const result = sanitizeUrl(url);
      expect(result).toContain('example.com');
    });

    it('should trim whitespace from URLs', () => {
      const result = sanitizeUrl('  https://example.com  ');
      expect(result).toContain('example.com');
    });

    it('should reject invalid URLs', () => {
      const result = sanitizeUrl('not a url');
      expect(result).toBe('');
    });

    it('should handle relative URLs as invalid', () => {
      const result = sanitizeUrl('/relative/path');
      expect(result).toBe('');
    });
  });
});
