/**
 * PAM project category helpers for create/edit fields and list filter chips.
 *
 * Significance: Dedupe / sort category strings from API (no hardcoded presets).
 * Core idea: Categories come from DB / ISR; UI allows free-text entry.
 * Main function: Export merge helper for option lists and chips.
 * Main purpose: Keep free-text `category` column with dynamic suggestion lists.
 *
 * @example
 * mergePamCategories(['前端', '工具', '前端']);
 * // => ['工具', '前端'] (zh sort)
 */

/**
 * Dedupes and sorts category labels (zh locale).
 *
 * @param categories - Categories from API and/or current form value
 * @returns Unique non-empty list
 */
export function mergePamCategories(
  categories: readonly string[] | undefined
): string[] {
  return Array.from(
    new Set(
      (categories ?? [])
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, 'zh'));
}
