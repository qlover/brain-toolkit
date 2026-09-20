import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCliLocaleType } from '../interfaces/PamCliTypes';
import { PamCliLocaleCatalog } from '../impls/PamCliLocaleCatalog';

/**
 * Directory of this module (works for ESM cli bundle and CJS library build).
 */
function getModuleDir(): string {
  // tsup CJS emit provides __dirname; prefer it to avoid empty import.meta.url
  if (typeof __dirname === 'string' && __dirname.length > 0) {
    return __dirname;
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // fall through
  }
  return process.cwd();
}

/**
 * Resolves the pamenv-cli package root (directory containing package.json).
 */
function resolvePackageRoot(): string {
  try {
    const require = createRequire(
      typeof import.meta !== 'undefined' && import.meta.url
        ? import.meta.url
        : join(getModuleDir(), 'noop.js')
    );
    return dirname(require.resolve('pamenv-cli/package.json'));
  } catch {
    // local workspace / not installed as package
  }

  let dir = getModuleDir();
  for (let i = 0; i < 8; i += 1) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
          name?: string;
        };
        if (pkg.name === 'pamenv-cli') {
          return dir;
        }
      } catch {
        // continue walking
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return getModuleDir();
}

/**
 * pamenv CLI UX i18n（`pamenv_cli:*`）+ PAM API 错误 i18n（`api:*`）。
 *
 * 存在意义：CLI 文案独立于 PAM，离线也能显示中英文提示。
 * 核心思路：本地 `dist/locales` 加载 CLI 文案；`api:*` 每次从
 * `{baseUrl}/api/locales/json?namespaces=api` 拉到内存，不写 config。
 * 主要能力：ensureLoaded / hydrateFromApi / syncFromStore / t / lookup。
 * 主要用途：login / init / push 等交互，以及 API 错误翻译。
 *
 * @example
 * await PamCliI18n.syncFromStore(authStore);
 * console.log(PamCliI18n.t(PAMENV_CLI_LOGIN_WAITING));
 */
export class PamCliI18n {
  protected static locale: PamCliLocaleType = 'en';
  protected static catalogs: Partial<
    Record<PamCliLocaleType, Record<string, string>>
  > = {};
  protected static apiCatalogs: Partial<
    Record<PamCliLocaleType, Record<string, string>>
  > = {};

  /**
   * 测试用：清空内存目录与语言。
   */
  public static reset(): void {
    this.locale = 'en';
    this.catalogs = {};
    this.apiCatalogs = {};
  }

  /**
   * @returns Absolute path to `dist/locales`
   */
  public static getLocalesDir(): string {
    const here = getModuleDir();
    const candidates = [
      join(here, 'locales'),
      join(resolvePackageRoot(), 'dist', 'locales'),
      join(here, '..', 'locales'),
      join(here, '..', 'dist', 'locales')
    ];
    for (const candidate of candidates) {
      if (existsSync(join(candidate, 'en.json'))) {
        return candidate;
      }
    }
    return join(resolvePackageRoot(), 'dist', 'locales');
  }

  /**
   * @param locale - 当前 CLI 语言
   */
  public static setLocale(locale: PamCliLocaleType): void {
    this.locale = locale;
  }

  /**
   * @returns 当前内存中的语言
   */
  public static getLocale(): PamCliLocaleType {
    return this.locale;
  }

  /**
   * 注入某语言的 CLI 目录（测试 / 预加载）。
   *
   * @param locale - 语言
   * @param messages - key → 文案
   */
  public static setCatalog(
    locale: PamCliLocaleType,
    messages: Readonly<Record<string, string>>
  ): void {
    this.catalogs[locale] = { ...messages };
  }

  /**
   * 从磁盘加载 `dist/locales/{locale}.json`（每种语言只加载一次）。
   *
   * @param locale - 要加载的语言
   */
  public static async ensureLoaded(
    locale: PamCliLocaleType = this.locale
  ): Promise<void> {
    if (this.catalogs[locale]) {
      return;
    }
    const localesDir = this.getLocalesDir();
    const filePath = join(localesDir, `${locale}.json`);
    try {
      const raw = readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`Invalid locale JSON: ${filePath}`);
      }
      const messages: Record<string, string> = {};
      for (const [key, value] of Object.entries(
        parsed as Record<string, unknown>
      )) {
        if (typeof value === 'string') {
          messages[key] = value;
        }
      }
      this.catalogs[locale] = messages;
    } catch {
      this.catalogs[locale] = {};
    }
  }

  /**
   * 从 PAM `/api/locales/json` 拉取 `api:*` 到内存。失败时抛错。
   *
   * @param authStore - 提供 baseUrl / locale
   * @returns 主语言加载到的 key 数量
   */
  public static async hydrateFromApi(
    authStore: PamCliAuthStoreInterface
  ): Promise<number> {
    const catalog = new PamCliLocaleCatalog(authStore);
    const locale = this.locale;
    const primary = await catalog.fetch(locale);
    this.apiCatalogs[locale] = { ...primary };
    if (locale !== 'en') {
      try {
        const fallback = await catalog.fetch('en');
        this.apiCatalogs.en = { ...fallback };
      } catch {
        // 英文回退失败时仍可使用主语言目录
      }
    }
    return Object.keys(primary).length;
  }

  /**
   * 读取 config 语言，加载本地 CLI 文案，并尽力拉取 PAM `api:*`。
   *
   * @param authStore - 当前配置
   */
  public static async syncFromStore(
    authStore: PamCliAuthStoreInterface
  ): Promise<void> {
    this.locale = await authStore.getLocale();
    await this.ensureLoaded(this.locale);
    if (this.locale !== 'en') {
      await this.ensureLoaded('en');
    }
    try {
      await this.hydrateFromApi(authStore);
    } catch {
      // PAM 不可达时 API 错误回退为服务端 message / key
    }
  }

  /**
   * 查找已加载文案；没有则返回 undefined（不回退为 key）。
   * 先查本地 CLI 目录，再查 PAM API 目录。
   *
   * @param key - 文案 id
   */
  public static lookup(key: string): string | undefined {
    return (
      this.catalogs[this.locale]?.[key] ||
      this.catalogs.en?.[key] ||
      this.apiCatalogs[this.locale]?.[key] ||
      this.apiCatalogs.en?.[key]
    );
  }

  /**
   * 查找文案；缺省回退为 key。
   *
   * @param key - 文案 id
   * @param vars - `{{name}}` 替换
   */
  public static t(
    key: string,
    vars?: Readonly<Record<string, string | number>>
  ): string {
    const template = this.lookup(key) || key;
    if (!vars) {
      return template;
    }
    return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
      const value = vars[name];
      return value === undefined || value === null ? '' : String(value);
    });
  }
}
