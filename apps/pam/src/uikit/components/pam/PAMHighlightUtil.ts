import { createElement, type ReactNode } from 'react';

/** Title keyword highlight — colors from CSS (data-theme aware). */
export const PAM_TEXT_HIGHLIGHT_CLASS = 'pam-highlight-text';

/** Active category chip — colors from CSS (data-theme aware). */
export const PAM_CATEGORY_HIGHLIGHT_CLASS = 'pam-highlight-category';

/**
 * Escapes a string for safe use inside a RegExp.
 *
 * @param value - Raw user keyword
 * @returns Escaped pattern fragment
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits `text` by case-insensitive `query` and wraps matches for highlight.
 *
 * Uses `<span>` (not `<mark>`) so UA mark styles cannot force light text.
 *
 * @param text - Full display string (e.g. project name)
 * @param query - Keyword to highlight; empty returns plain text
 * @returns React nodes suitable for inline title rendering
 */
export function highlightText(text: string, query: string): ReactNode {
  const needle = query.trim();
  if (!text || !needle) {
    return text;
  }

  const pattern = new RegExp(`(${escapeRegExp(needle)})`, 'gi');
  const parts = text.split(pattern);
  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (part.toLowerCase() === needle.toLowerCase()) {
      return createElement(
        'span',
        {
          key: `hl-${index}`,
          className: PAM_TEXT_HIGHLIGHT_CLASS,
          'data-testid': 'PAMHighlightMark'
        },
        part
      );
    }
    return part;
  });
}

/**
 * Whether category chip should use the active-filter highlight style.
 *
 * @param category - Project category text
 * @param activeCategory - Current category filter (empty = none)
 */
export function isCategoryHighlightActive(
  category: string | null | undefined,
  activeCategory: string
): boolean {
  const cat = category?.trim() ?? '';
  const active = activeCategory.trim();
  return cat.length > 0 && active.length > 0 && cat === active;
}
