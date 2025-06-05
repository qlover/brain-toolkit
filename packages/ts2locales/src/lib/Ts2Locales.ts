import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// 配置选项类型
export interface Ts2LocalesOptions {
  /**
   * 本地化前缀，默认为 'local'
   * @example
   * // 默认情况下使用 @localZh, @localEn
   * // 如果设置为 'i18n'，则使用 @i18nZh, @i18nEn
   */
  localPrefix: string;
  /**
   * 描述标签名称
   */
  descriptionKey: string;
  /**
   * JSDoc 正则表达式
   */
  jsdocRegex: RegExp;
  /**
   * 字符串字面量正则表达式
   */
  stringLiteralRegex: RegExp;
  /**
   * 元数据行正则表达式
   */
  metadataLineRegex: RegExp;
}

// 默认配置
const DEFAULT_OPTIONS: Ts2LocalesOptions = {
  localPrefix: 'local',
  descriptionKey: 'description',
  jsdocRegex:
    /\/\*\*\s*([\s\S]*?)\s*\*\/\s*export\s+const\s+([A-Z_0-9]+)\s*=\s*(['"][^'"]+['"])\s*;?/g,
  stringLiteralRegex: /^['"]([^'"]+)['"]$/,
  metadataLineRegex: /@(\w+)\s*(.*)?/
};

export type Ts2LocalesValue = {
  /**
   * @description The path to the source file
   * @example
   *
   * ```ts
   * './config/ErrorIdentifier.ts'
   * ```
   */
  source: string;

  /**
   * @description The path to the target file
   * @example
   *
   * ```ts
   * {
   *  source: './config/ErrorIdentifier.ts',
   *  target: './locales/{{lng}}/common.json'
   * }
   * // or
   * {
   *  source: './config/ErrorIdentifier.ts',
   *  target: './locales/common.{{lng}}.json'
   * }
   * ```
   */
  target: string;
};

// 支持的语言代码类型
export type LocaleCode = string;

// 本地化值类型
export type SourceParseValue = {
  key: string;
  value: string;
  description: string;
  [key: string]: string;
};

/**
 * Ts2Locales class
 *
 * @description A utility class for extracting internationalization information from TypeScript files and generating localization files
 * @class
 */
export class Ts2Locales {
  private readonly options: Ts2LocalesOptions;

  /**
   * Creates a new Ts2Locales instance
   *
   * @param locales - Array of supported locale codes, e.g. ['zh', 'en']
   * @param options - Configuration options
   * @throws {Error} If locales array is empty
   */
  constructor(
    private readonly locales: LocaleCode[],
    options: Partial<Ts2LocalesOptions> = {}
  ) {
    if (!locales.length) {
      throw new Error('At least one locale must be provided');
    }

    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Converts a locale code to its corresponding metadata key
   * @param locale - The locale code to convert
   * @returns The metadata key for the locale
   */
  private getLocaleKey(locale: LocaleCode): `locale${Capitalize<LocaleCode>}` {
    const capitalizedLocale = locale.charAt(0).toUpperCase() + locale.slice(1);
    return `locale${capitalizedLocale}` as `locale${Capitalize<LocaleCode>}`;
  }

  /**
   * Validates a string literal value
   * @param value - The value to validate
   * @param key - The key associated with the value (for error messages)
   * @returns The cleaned string value
   * @throws {Error} If the value is not a valid string literal
   */
  private validateStringLiteral(value: string, key: string): string {
    const trimmedValue = value.trim();
    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
      throw new Error(
        `Invalid value for key "${key}": Object or array values are not allowed, value: ${value}`
      );
    }
    if (!trimmedValue.startsWith("'") && !trimmedValue.startsWith('"')) {
      throw new Error(
        `Invalid value for key "${key}": Only string literals are allowed, value: ${value}`
      );
    }
    const match = trimmedValue.match(this.options.stringLiteralRegex);
    if (!match) {
      throw new Error(`Invalid string literal for key "${key}": ${value}`);
    }
    return match[1];
  }

  private extractMetadata(jsdoc: string): Record<string, string> {
    const metadata: Record<string, string> = {
      [this.options.descriptionKey]: ''
    };

    // Initialize values for provided locales only
    for (const locale of this.locales) {
      metadata[this.getLocaleKey(locale)] = '';
    }

    // Extract all lines starting with @
    const lines = jsdoc.split('\n');
    for (const line of lines) {
      const match = line.match(this.options.metadataLineRegex);
      if (match) {
        const [, key, value = ''] = match;
        if (key === this.options.descriptionKey) {
          metadata[this.options.descriptionKey] = value.trim();
        } else if (key.startsWith(this.options.localPrefix)) {
          const locale = key
            .slice(this.options.localPrefix.length)
            .toLowerCase();
          // Only process locales that were provided in constructor
          if (this.locales.includes(locale)) {
            const localeKey = this.getLocaleKey(locale);
            metadata[localeKey] = value.trim();
          }
        }
      }
    }

    return metadata;
  }

  parse(content: string): SourceParseValue[] {
    const resultsMap = new Map<string, SourceParseValue>();

    let match;
    while ((match = this.options.jsdocRegex.exec(content)) !== null) {
      const [, jsdoc, key, rawValue] = match;
      const value = this.validateStringLiteral(rawValue, key);
      const metadata = this.extractMetadata(jsdoc);

      this.validateMetadata(metadata, key);

      const entry: SourceParseValue = {
        key,
        value,
        description: metadata[this.options.descriptionKey],
        ...Object.fromEntries(
          this.locales.map((locale) => [
            this.getLocaleKey(locale),
            metadata[this.getLocaleKey(locale)]
          ])
        )
      };

      // Store the entry in the map using value as the key instead of the constant name
      resultsMap.set(entry.key, entry);
    }

    // Convert the map values back to an array
    return Array.from(resultsMap.values());
  }

  /**
   * Validates metadata and logs warnings for missing values
   * @param metadata - The metadata to validate
   * @param key - The key associated with the metadata
   */
  private validateMetadata(
    metadata: Record<string, string>,
    key: string
  ): void {
    if (!metadata[this.options.descriptionKey]) {
      console.warn(`Warning: Empty @description found for key "${key}"`);
    }

    for (const locale of this.locales) {
      const localeKey = this.getLocaleKey(locale);
      if (!metadata[localeKey]) {
        console.warn(
          `Warning: Empty @${this.options.localPrefix}${locale} found for key "${key}"`
        );
      }
    }
  }

  /**
   * Extracts internationalization information from the source file
   *
   * @param source - Source file path
   * @returns Array of extracted internationalization information objects
   */
  getSourceParseValue(source: string): SourceParseValue[] {
    return this.parse(readFileSync(source, 'utf-8'));
  }

  /**
   * Creates localization file content based on extracted internationalization information
   *
   * @param locale - Locale code, e.g. 'zh', 'en'
   * @param sourceParseValues - Array of internationalization information extracted from the source file
   * @returns Object containing the localization content
   */
  create(
    locale: string,
    sourceParseValues: SourceParseValue[]
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const item of sourceParseValues) {
      // Dynamically get the localization value for the current language
      const localeKey = this.getLocaleKey(locale);
      const itemKey = item[localeKey as keyof SourceParseValue];

      if (itemKey) {
        result[item.value] = itemKey;
      } else {
        // If there is no corresponding localization content, use the description or original value
        result[item.value] = item.description || item.value || item.key;
      }
    }

    return result;
  }

  /**
   * Generates localization files
   *
   * @param value - Object containing source file path and target file path
   * @returns Returns a Promise indicating the completion of the generation operation
   */
  async generate(value: Ts2LocalesValue): Promise<void> {
    const { source, target } = value;

    if (!existsSync(source)) {
      throw new Error(`Source file ${source} does not exist`);
    }

    // 1. Get internationalization information from the source file
    const sourceParseValues = this.getSourceParseValue(source);

    for (const locale of this.locales) {
      // 2. Create localization file content
      const localeJSONContent = this.create(locale, sourceParseValues);

      // 3. Read target file path
      const targetPath = target.replace('{{lng}}', locale);

      // 4. Write to target file, merge content if file exists
      if (existsSync(targetPath)) {
        const targetFile = readFileSync(targetPath, 'utf-8');
        const targetFileJson = JSON.parse(targetFile);
        const mergedFile = { ...targetFileJson, ...localeJSONContent };
        writeFileSync(targetPath, JSON.stringify(mergedFile, null, 2));
      } else {
        // If it doesn't exist, create directory path and new file
        const dirPath = dirname(targetPath);
        if (!existsSync(dirPath)) {
          mkdirSync(dirPath, { recursive: true });
        }
        writeFileSync(targetPath, JSON.stringify(localeJSONContent, null, 2));
      }
    }
  }
}
