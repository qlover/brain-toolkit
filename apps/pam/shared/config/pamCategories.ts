/**
 * PAM project category presets and merge helpers.
 *
 * Significance: Single source for create/edit selects and list filter chips.
 * Core idea: Keep free-text `category` column; ship Chinese presets matching
 * existing production data; allow custom values beyond the preset list.
 * Main function: Export presets + merge/dedupe utilities for UI.
 * Main purpose: Avoid duplicated hardcoded option lists across forms.
 *
 * @example
 * mergePamCategories(['自定义', '前端']);
 * // => ['前端', '后端', ..., '其他', '自定义'] (presets first, then extras)
 */

export const PAM_CATEGORY_PRESETS = [
  '前端',
  '后端',
  '工具',
  '文档',
  '基础设施',
  '其他'
] as const;

export type PamCategoryPresetType = (typeof PAM_CATEGORY_PRESETS)[number];

/** Sentinel value for the “custom” option in category selects. */
export const PAM_CATEGORY_CUSTOM = '__custom__' as const;

/**
 * Whether `value` matches a known preset (exact string).
 *
 * @param value - Category string from form or project row
 * @returns True when value is one of {@link PAM_CATEGORY_PRESETS}
 */
export function isPamCategoryPreset(value: string): boolean {
  return (PAM_CATEGORY_PRESETS as readonly string[]).includes(value);
}

/**
 * Merges presets with extra categories (e.g. from loaded projects).
 * Presets keep declared order; extras are unique, non-empty, sorted.
 *
 * @param extras - Categories observed in data or user input
 * @returns Deduped list for chips / select options
 */
export function mergePamCategories(
  extras: readonly string[] | undefined
): string[] {
  const presetSet = new Set<string>(PAM_CATEGORY_PRESETS);
  const extraSorted = Array.from(
    new Set(
      (extras ?? [])
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && !presetSet.has(item))
    )
  ).sort((a, b) => a.localeCompare(b, 'zh'));

  return [...PAM_CATEGORY_PRESETS, ...extraSorted];
}
