/**
 * Case conversion utility functions
 *
 * Significance: Provides utility functions for string case transformations
 * Core idea: Convert snake_case strings to PascalCase or camelCase
 * Main function: Transform snake_case strings into PascalCase/camelCase with customizable prefixes
 * Main purpose: Support dynamic method generation and string formatting
 *
 * @example
 * ```ts
 * snakeCaseToPascalCase('disable_gen_UI', 'disable_'); // 'GenUI'
 * snakeCaseToPascalCase('disable_no_meeting_tab', 'disable_'); // 'NoMeetingTab'
 * snakeCaseToPascalCase('test'); // 'Test'
 * snakeCaseToCamelCase('disable_gen_UI', 'has', 'disable_'); // 'hasGenUI'
 * ```
 */

// ============================================================================
// Type-level case conversion utilities
// ============================================================================

/**
 * Capitalize the first letter of a string type
 *
 * @example
 * ```ts
 * type Result = Capitalize<'hello'>; // 'Hello'
 * type Result2 = Capitalize<'world'>; // 'World'
 * ```
 */
type Capitalize<S extends string> = S extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : S;

/**
 * Remove prefix from a string type
 *
 * @example
 * ```ts
 * type Result = RemovePrefix<'disable_gen_ui', 'disable_'>; // 'gen_ui'
 * type Result2 = RemovePrefix<'enable_feature', 'enable_'>; // 'feature'
 * ```
 */
type RemovePrefix<
  S extends string,
  Prefix extends string
> = S extends `${Prefix}${infer Rest}` ? Rest : S;

/**
 * Convert snake_case string type to PascalCase
 *
 * Significance: Type-level string transformation for compile-time type safety
 * Core idea: Recursively split by underscore and capitalize each part
 * Main function: Transform snake_case type to PascalCase type
 * Main purpose: Enable type-safe dynamic method name generation
 *
 * @example
 * ```ts
 * type Result1 = SnakeToPascal<'disable_amazon_search_graphql'>; // 'DisableAmazonSearchGraphql'
 * type Result2 = SnakeToPascal<'gen_ui'>; // 'GenUi'
 * type Result3 = SnakeToPascal<'no_meeting_tab'>; // 'NoMeetingTab'
 * ```
 */
export type SnakeToPascal<S extends string> =
  S extends `${infer Part}_${infer Rest}`
    ? `${Capitalize<Part>}${SnakeToPascal<Rest>}`
    : Capitalize<S>;

/**
 * Convert snake_case string type to PascalCase with prefix removal
 *
 * @example
 * ```ts
 * type Result = SnakeToPascalWithPrefix<'disable_amazon_search_graphql', 'disable_'>; // 'AmazonSearchGraphql'
 * type Result2 = SnakeToPascalWithPrefix<'enable_feature_x', 'enable_'>; // 'FeatureX'
 * ```
 */
export type SnakeToPascalWithPrefix<
  S extends string,
  Prefix extends string
> = SnakeToPascal<RemovePrefix<S, Prefix>>;

/**
 * Convert snake_case string type to camelCase with method prefix
 *
 * @example
 * ```ts
 * type Result = SnakeToCamel<'disable_gen_ui', 'has', 'disable_'>; // 'hasGenUi'
 * type Result2 = SnakeToCamel<'admin_role', 'check'>; // 'checkAdminRole'
 * type Result3 = SnakeToCamel<'enable_feature', 'is', 'enable_'>; // 'isFeature'
 * ```
 */
export type SnakeToCamel<
  S extends string,
  MethodPrefix extends string = 'has',
  RemovePrefixStr extends string = ''
> = RemovePrefixStr extends ''
  ? `${MethodPrefix}${SnakeToPascal<S>}`
  : `${MethodPrefix}${SnakeToPascalWithPrefix<S, RemovePrefixStr>}`;

// ============================================================================
// Runtime functions with type inference
// ============================================================================

/**
 * Convert snake_case string to PascalCase
 *
 * Rules:
 * 1. Remove specified prefix (e.g., 'disable_', 'enable_')
 * 2. Split by underscore
 * 3. Capitalize first letter of each word
 * 4. Preserve existing uppercase letters (e.g., UI, API)
 *
 * @param str - The snake_case string to convert
 * @param removePrefix - The prefix to remove from the string (e.g., 'disable_', 'enable_')
 * @returns The converted PascalCase string with type inference
 *
 * @example
 * ```ts
 * snakeCaseToPascalCase('disable_gen_UI', 'disable_'); // 'GenUI'
 * snakeCaseToPascalCase('disable_no_meeting_tab', 'disable_'); // 'NoMeetingTab'
 * snakeCaseToPascalCase('test'); // 'Test'
 * snakeCaseToPascalCase('enable_feature_x', 'enable_'); // 'FeatureX'
 * snakeCaseToPascalCase('disable_android_asr', 'disable_'); // 'AndroidAsr'
 * snakeCaseToPascalCase('execution_agent'); // 'ExecutionAgent'
 *
 * // Type inference example:
 * const result = snakeCaseToPascalCase('disable_amazon_search_graphql' as const, 'disable_');
 * // result type: 'AmazonSearchGraphql'
 * ```
 */
export function snakeCaseToPascalCase<
  S extends string,
  P extends string | undefined = undefined
>(
  str: S,
  removePrefix?: P
): P extends string ? SnakeToPascalWithPrefix<S, P> : SnakeToPascal<S>;
export function snakeCaseToPascalCase(
  str: string,
  removePrefix?: string
): string {
  // Remove specified prefix if provided
  let cleanStr = str;
  if (removePrefix && str.startsWith(removePrefix)) {
    cleanStr = str.replace(removePrefix, '');
  }

  // Split by underscore and process each part
  const parts = cleanStr.split('_');

  return parts
    .map((part) => {
      // If the part is already all uppercase (like UI, API), keep it
      if (part === part.toUpperCase() && part.length > 1) {
        return part;
      }
      // Otherwise, capitalize first letter and keep the rest as is
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

/**
 * Convert snake_case string to camelCase with custom prefix
 *
 * @param str - The snake_case string to convert
 * @param methodPrefix - The prefix to add to the method name (e.g., 'has', 'is', 'get')
 * @param removePrefix - The prefix to remove from the string (e.g., 'disable_', 'enable_')
 * @returns The camelCase string with specified prefix (e.g., 'hasGenUI', 'isFeatureEnabled')
 *
 * @example
 * ```ts
 * snakeCaseToCamelCase('disable_gen_UI', 'has', 'disable_'); // 'hasGenUI'
 * snakeCaseToCamelCase('disable_no_meeting_tab', 'has', 'disable_'); // 'hasNoMeetingTab'
 * snakeCaseToCamelCase('test', 'has'); // 'hasTest'
 * snakeCaseToCamelCase('enable_feature_x', 'is', 'enable_'); // 'isFeatureX'
 * snakeCaseToCamelCase('admin_role', 'check'); // 'checkAdminRole'
 *
 * // Type inference example:
 * const result = snakeCaseToCamelCase('disable_amazon_search_graphql' as const, 'has', 'disable_');
 * // result type: 'hasAmazonSearchGraphql'
 * ```
 */
export function snakeCaseToCamelCase<
  S extends string,
  M extends string = 'has',
  P extends string | undefined = undefined
>(
  str: S,
  methodPrefix?: M,
  removePrefix?: P
): P extends string ? SnakeToCamel<S, M, P> : SnakeToCamel<S, M, ''>;
export function snakeCaseToCamelCase(
  str: string,
  methodPrefix: string = 'has',
  removePrefix?: string
): string {
  return `${methodPrefix}${snakeCaseToPascalCase(str, removePrefix)}`;
}

/**
 * @deprecated Use snakeCaseToPascalCase instead
 * Convert tag string to PascalCase
 */
export function convertTagToPascalCase(
  tag: string,
  removePrefix?: string
): string {
  return snakeCaseToPascalCase(tag, removePrefix);
}

/**
 * @deprecated Use snakeCaseToCamelCase instead
 * Convert tag string to method name with custom prefix
 */
export function convertTagToMethodName(
  tag: string,
  methodPrefix: string = 'has',
  removePrefix?: string
): string {
  return snakeCaseToCamelCase(tag, methodPrefix, removePrefix);
}
