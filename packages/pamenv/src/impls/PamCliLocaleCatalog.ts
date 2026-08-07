import { readFile } from 'node:fs/promises';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCliLocaleType } from '../interfaces/PamCliTypes';
import { PamCliPrivateFsUtil } from './PamCliPrivateFsUtil';

/**
 * Loads and caches PAM locale JSON for translating API `id` keys in the CLI.
 *
 * Significance: Turns `api:not_authorized` into localized human text.
 * Core idea: Fetch `{baseUrl}/api/locales/json?locale=` and cache under `.pam/locales`.
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
   * Loads cache from disk, or fetches once when missing.
   */
  public async ensureLoaded(): Promise<void> {
    const locale = await this.authStore.getLocale();
    if (this.messages && this.loadedLocale === locale) {
      return;
    }

    const fromDisk = await this.readCache(locale);
    if (fromDisk) {
      this.messages = fromDisk;
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
   * Force-refresh locale JSON from the active PAM base URL.
   *
   * @returns Number of keys written
   */
  public async pull(): Promise<number> {
    const locale = await this.authStore.getLocale();
    const baseUrl = await this.authStore.getBaseUrl();
    const url = `${baseUrl}/api/locales/json?locale=${encodeURIComponent(locale)}`;
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

    const messages: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      body as Record<string, unknown>
    )) {
      if (typeof value === 'string') {
        messages[key] = value;
      }
    }

    const path = this.authStore.getLocaleCachePath(locale);
    await PamCliPrivateFsUtil.writePrivateFile(
      path,
      `${JSON.stringify(messages, null, 2)}\n`
    );

    this.messages = messages;
    this.loadedLocale = locale;
    return Object.keys(messages).length;
  }

  /**
   * @param id - i18n / API error id
   * @returns Localized string or undefined
   */
  public t(id: string): string | undefined {
    if (!id || !this.messages) {
      return undefined;
    }
    const direct = this.messages[id];
    if (direct) {
      return direct;
    }
    return undefined;
  }

  protected async readCache(
    locale: PamCliLocaleType
  ): Promise<Record<string, string> | null> {
    try {
      const raw = await readFile(
        this.authStore.getLocaleCachePath(locale),
        'utf8'
      );
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const messages: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          messages[key] = value;
        }
      }
      return messages;
    } catch {
      return null;
    }
  }
}
