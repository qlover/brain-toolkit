import { PRE_FEATURE_TAGS } from './config/PreFeatureTags';
import { BrainWebTagsCheckerInterface } from './interface/BrainWebTagsCheckerInterface';
import { BrainUserFeatureTagType } from './types/BrainUserTypes';
import { snakeCaseToCamelCase, type SnakeToCamel } from './utils/caseConverter';

/**
 * Dynamic feature tags interface with type-safe method names
 *
 * Significance: Generate type-safe checker methods from feature tag array
 * Core idea: Use TypeScript template literal types to transform snake_case tags to camelCase methods
 * Main function: Provide compile-time type safety for dynamically generated methods
 * Main purpose: Enable autocomplete and type checking for feature tag checker methods
 *
 * @example
 * ```ts
 * type Tags = readonly ['disable_gen_ui', 'disable_no_meeting_tab'];
 * type Interface = DynamicFeatureTagsInterface<Tags>;
 * // Result:
 * // {
 * //   hasGenUi: (isGuest?: boolean) => boolean;
 * //   hasNoMeetingTab: (isGuest?: boolean) => boolean;
 * // }
 * ```
 */
export type DynamicFeatureTagsInterface<T extends readonly string[]> = {
  [K in T[number] as SnakeToCamel<K, 'has', 'disable_'>]: (
    isGuest?: boolean
  ) => boolean;
};

export type FeatureTagsOptions<
  Tags extends readonly BrainUserFeatureTagType[]
> = {
  featureTags: BrainUserFeatureTagType[];
  preFeatureTags?: Tags;
};

/**
 * 该类用于判断当前用户是否存在某个 feature tag
 *
 * **该类用于兼容 brain web 中对 feature_tags 的判断逻辑**
 *
 * 特别注意: brain web 中默认有权限优先, 即如果用户存在 disabled_xxx 开头，则返回 false，否则返回 true
 *
 * @example
 *
 * ```
 * {
 *   feature_tags: [
 *     'disabled_gen_UI',
 *   ]
 * }
 * // 那么用户除了 disabled_gen_UI 之外拥有其他所有权限
 * ```
 *
 * 并且由于 featureTags 可能较多, 传入参数 preFeatureTags 可以在运行时动态添加预设的 feature tags
 *
 * 但是该参数不会用于权限的判断，只会动态生成快捷方法
 *
 * @example
 * ```ts
 * const featureTags = new FeatureTags(
 *  [
 *    'disable_gen_UI',
 *    'test',
 *  ],
 *  [
 *    'disable_gen_UI',
 *    'disable_no_meeting_tab',
 *    'test',
 *  ] as const
 * )
 *
 * featureTags.hasGenUI(); // false
 * featureTags.hasNoMeetingTab(); // true, 因为 featureTags 中没有 disable_no_meeting_tab 这个 tag
 * featureTags.hasTest(); // false
 * ```
 */
export class FeatureTags<T extends readonly BrainUserFeatureTagType[] = []>
  implements BrainWebTagsCheckerInterface
{
  protected featureTags: BrainUserFeatureTagType[];
  constructor(options: FeatureTagsOptions<T>) {
    this.featureTags = options.featureTags;

    if (options.preFeatureTags) {
      Object.values(options.preFeatureTags).forEach((tag) => {
        const methodName = snakeCaseToCamelCase(tag, 'has', 'disable_');
        Object.assign(this, {
          [methodName]: (isGuest?: boolean) => this.has(tag, isGuest)
        });
      });
    }
  }

  public getFeatureTags(): BrainUserFeatureTagType[] {
    return this.featureTags;
  }

  public setFeatureTags(featureTags: BrainUserFeatureTagType[]): void {
    this.featureTags = featureTags;
  }

  /**
   * 判断是否存在某个 feature tag
   *
   * 该方法兼容 brain web 中对 feature_tags 的判断逻辑，如果存在 disabled_xxx 开头的 tag，则返回 false，否则返回 true
   *
   * **仅处理 disable_xxx 开头的 tag, 其他的可能逻辑不一致，请使用 disableFeatureTag 和 enableFeatureTag 方法**
   *
   * @param featureTag 要判断的 feature tag
   * @param isGuest 是否为游客, 如果是游客, 则返回 false(游客默认无权限)
   */
  public has(
    featureTag: BrainUserFeatureTagType,
    isGuest?: boolean
  ): boolean {
    if (isGuest) {
      return false;
    }

    if (this.getFeatureTags().includes(featureTag)) {
      return false;
    }

    // has feature tag
    return true;
  }

  /**
   * @override
   */
  public disableFeatureTag(featureTag: BrainUserFeatureTagType): boolean {
    const tags = this.getFeatureTags();
    return tags.includes(featureTag);
  }

  /**
   * @override
   */
  public enableFeatureTag(
    featureTag: BrainUserFeatureTagType,
    isGuest?: boolean
  ): boolean {
    if (isGuest) {
      return false;
    }
    const tags = this.getFeatureTags();
    return tags.includes(featureTag) === false;
  }
}

/**
 * Type-safe FeatureTags with dynamic method names
 *
 * Significance: Combine FeatureTags class with DynamicFeatureTagsInterface for full type safety
 * Core idea: Use intersection type to merge class type with dynamic interface
 * Main function: Provide compile-time type checking for dynamically generated methods
 * Main purpose: Enable autocomplete and type safety when using feature tag checker methods
 *
 * @example
 * ```ts
 * type MyFeatureTags = FeatureTagsWithDynamicMethods<typeof PRE_FEATURE_TAGS>;
 * // MyFeatureTags will have methods like:
 * // - hasAmazonSearchGraphql()
 * // - hasGenUI()
 * // - hasNoMeetingTab()
 * // etc.
 * ```
 */
export type DynamicFeatureTags<
  T extends readonly BrainUserFeatureTagType[]
> = FeatureTags<T> & DynamicFeatureTagsInterface<T>;

/**
 * Create a type-safe FeatureTags instance with dynamic methods
 *
 * Significance: Factory function for creating type-safe FeatureTags instances
 * Core idea: Use generic type inference to automatically generate correct method types
 * Main function: Create FeatureTags with full type safety for dynamic methods
 * Main purpose: Provide better developer experience with autocomplete and type checking
 *
 * @param featureTags - The actual feature tags from user
 * @param preFeatureTags - Pre-defined feature tags for dynamic method generation (use 'as const')
 * @returns Type-safe FeatureTags instance with dynamic methods
 *
 * @example
 * ```ts
 * import { PRE_FEATURE_TAGS } from './config/PreFeatureTags';
 *
 * const checker = createFeatureTags(
 *   ['disable_gen_UI'],
 *   PRE_FEATURE_TAGS
 * );
 *
 * // TypeScript knows about these methods:
 * checker.hasGenUI();              // ✓ Type-safe, autocomplete works
 * checker.hasAmazonSearchGraphql(); // ✓ Type-safe, autocomplete works
 * checker.hasNoMeetingTab();        // ✓ Type-safe, autocomplete works
 * ```
 */
export function createFeatureTags<
  T extends readonly BrainUserFeatureTagType[] = typeof PRE_FEATURE_TAGS
>(options?: FeatureTagsOptions<T>): DynamicFeatureTags<T> {
  return new FeatureTags({
    featureTags: options?.featureTags ?? [],
    preFeatureTags: options?.preFeatureTags ?? PRE_FEATURE_TAGS
  }) as DynamicFeatureTags<T>;
}

