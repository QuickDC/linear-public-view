/**
 * Truncates a string to a maximum length and adds ellipsis
 */
export function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + '...';
}

/**
 * Formats a date string to a human-readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than a day
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) return 'Just now';
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }

  // Less than a week
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // Format as date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Gets Tailwind color class for a label color
 */
export function getLabelColorClass(color: string): string {
  // Linear colors are in hex format, we'll create a simple mapping
  // or use the color directly with inline styles
  return color;
}

/**
 * Validates email format (basic validation)
 */
export function isValidEmail(email: string): boolean {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}
