import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCliLocaleType } from '../interfaces/PamCliTypes';

/**
 * Namespaces cached for CLI API error translation.
 * Matches PAM `/api/locales/json?namespaces=…`.
 */
export const PAMENV_LOCALE_NAMESPACES = ['api'] as const;

/**
 * Loads and caches PAM locale JSON for translating API `id` keys in the CLI.
 *
 * Significance: Turns `api:not_authorized` into localized human text.
 * Core idea: Fetch `{baseUrl}/api/locales/json?locale=&namespaces=api`
 * and store under `config.json` → `localeMessages`.
 * Main function: ensureLoaded / pull / t(id).
 * Main purpose: Readable CLI errors when locale is configured.
 *
 * @example
 * const catalog = new PamCliLocaleCatalog(authStore);
 * await catalog.ensureLoaded();
 * catalog.t('api:not_authorized');
 */
export class PamCliLocaleCatalog {
  protected messages: Record<string, string> | null = null;
  protected loadedLocale: PamCliLocaleType | null = null;

  constructor(protected readonly authStore: PamCliAuthStoreInterface) {}

  /**
   * Loads messages from config, or fetches once when missing / empty.
   */
  public async ensureLoaded(): Promise<void> {
    const locale = await this.authStore.getLocale();
    if (this.messages && this.loadedLocale === locale) {
      return;
    }

    const config = await this.authStore.getConfig();
    if (
      config.locale === locale &&
      config.localeMessages &&
      Object.keys(config.localeMessages).length > 0
    ) {
      this.messages = { ...config.localeMessages };
      this.loadedLocale = locale;
      return;
    }

    try {
      await this.pull();
    } catch {
      this.messages = {};
      this.loadedLocale = locale;
    }
  }

  /**
   * Force-refresh locale JSON from the active PAM base URL into config.json.
   * Only keeps `api:` keys.
   *
   * @returns Number of keys written
   */
  public async pull(): Promise<number> {
    const locale = await this.authStore.getLocale();
    const baseUrl = await this.authStore.getBaseUrl();
    const namespaces = PAMENV_LOCALE_NAMESPACES.join(',');
    const url =
      `${baseUrl}/api/locales/json` +
      `?locale=${encodeURIComponent(locale)}` +
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

    const messages = this.filterCliNamespaces(body as Record<string, unknown>);
    const count = Object.keys(messages).length;
    if (count === 0) {
      throw new Error(
        `PAM returned no api locale keys from ${url}. Is PAM running with generated public/locales?`
      );
    }

    await this.authStore.setLocaleMessages(messages);
    await this.removeLegacyLocalesDir();
    this.messages = messages;
    this.loadedLocale = locale;
    return count;
  }

  /**
   * @param id - i18n / API error id
   * @returns Localized string or undefined
   */
  public t(id: string): string | undefined {
    if (!id || !this.messages) {
      return undefined;
    }
    return this.messages[id];
  }

  /**
   * Keeps only CLI-relevant namespaces (`api:…`).
   *
   * @param body - Raw locale map from PAM
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

  /**
   * Best-effort cleanup of the former `{pamRoot}/locales` directory.
   */
  protected async removeLegacyLocalesDir(): Promise<void> {
    try {
      const { rm } = await import('node:fs/promises');
      const { join } = await import('node:path');
      await rm(join(this.authStore.getActivePamRoot(), 'locales'), {
        recursive: true,
        force: true
      });
    } catch {
      // ignore
    }
  }
}
