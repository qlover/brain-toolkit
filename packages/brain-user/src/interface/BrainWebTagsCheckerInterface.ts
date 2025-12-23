/**
 * 这个接口是关于 brain web 中判断 feature_tags 检查方法
 *
 * 由于 brain web 中 feature_tags 的判断逻辑比较特殊，所以需要一个专门的接口来处理
 *
 * **该接口用于兼容 brain web 逻辑，但不见建议继续使用**
 */
export interface BrainWebTagsCheckerInterface {
  /**
   * 判断是否禁用某个权限
   *
   * @example
   * ```ts
   * tags.includes(featureTag)
   * ```
   * @param featureTag
   * @returns
   */
  disableFeatureTag(featureTag: string): boolean;

  /**
   * 判断是否启用某个权限
   *
   * @example
   *
   * ```ts
   * tags.includes(featureTag) === false
   * ```
   *
   * @param featureTag
   * @param isGuest
   * @returns
   */
  enableFeatureTag(featureTag: string, isGuest?: boolean): boolean;
}
