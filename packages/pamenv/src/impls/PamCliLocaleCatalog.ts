import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCliLocaleType } from '../interfaces/PamCliTypes';

/**
 * CLI 从 PAM 拉取的 i18n 命名空间（仅 API 错误）。
 * 与 `/api/locales/json?namespaces=…` 对齐。
 */
export const PAMENV_LOCALE_NAMESPACES = ['api'] as const;

/**
 * 从 PAM 拉取 `api:*` locale JSON（仅内存，不写 config）。
 *
 * 存在意义：把 `api:not_authorized` 等译成当前语言。
 * 核心思路：请求 `{baseUrl}/api/locales/json?locale=&namespaces=api`。
 * 主要能力：fetch(locale)。
 * 主要用途：供 PamCliI18n 在命令开始时灌入 API 错误目录。
 *
 * @example
 * const catalog = new PamCliLocaleCatalog(authStore);
 * const messages = await catalog.fetch('zh');
 */
export class PamCliLocaleCatalog {
  constructor(protected readonly authStore: PamCliAuthStoreInterface) {}

  /**
   * 从当前 PAM origin 拉取指定语言的 API 文案。
   *
   * @param locale - 语言；缺省用 config.locale
   * @returns 过滤后的 key → 文案
   */
  public async fetch(
    locale?: PamCliLocaleType
  ): Promise<Record<string, string>> {
    const resolvedLocale = locale ?? (await this.authStore.getLocale());
    const baseUrl = await this.authStore.getBaseUrl();
    const namespaces = PAMENV_LOCALE_NAMESPACES.join(',');
    const url =
      `${baseUrl}/api/locales/json` +
      `?locale=${encodeURIComponent(resolvedLocale)}` +
      `&namespaces=${encodeURIComponent(namespaces)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch locales (HTTP ${response.status}) from ${url}`
      );
    }

    const body = (await response.json()) as unknown;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error(`Invalid locales payload from ${url}`);
    }

    return this.filterCliNamespaces(body as Record<string, unknown>);
  }

  /**
   * 只保留 CLI 需要的命名空间（`api:`）。
   *
   * @param body - PAM 返回的扁平 locale map
   */
  protected filterCliNamespaces(
    body: Record<string, unknown>
  ): Record<string, string> {
    const messages: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== 'string') {
        continue;
      }
      const keep = PAMENV_LOCALE_NAMESPACES.some((ns) =>
        key.startsWith(`${ns}:`)
      );
      if (keep) {
        messages[key] = value;
      }
    }
    return messages;
  }
}
