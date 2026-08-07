import { PamCliConfig } from '../config/PamCliConfig';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import { PamCliLocaleCatalog } from '../impls/PamCliLocaleCatalog';

/**
 * `pamenv config` — get/set/list persisted CLI settings.
 *
 * Significance: Persist default domain and locale without repeating flags.
 * Core idea: Small key/value surface over `.pam/config.json`.
 * Main function: set domain/url/locale; list active values.
 * Main purpose: Local PAM testing and localized API errors.
 */
export class ConfigCommand {
  constructor(
    protected readonly authStore: PamCliAuthStoreInterface,
    protected readonly localeCatalog: PamCliLocaleCatalog
  ) {}

  /**
   * @param key - Config key
   * @param value - Raw value
   */
  public async set(key: string, value: string): Promise<void> {
    const normalizedKey = key.trim().toLowerCase();
    if (!value?.trim()) {
      throw new Error(`Missing value for config key \`${normalizedKey}\``);
    }

    switch (normalizedKey) {
      case 'domain':
      case 'url':
      case 'baseurl':
      case 'base_url': {
        const origin = PamCliConfig.normalizeOrigin(value);
        await this.authStore.setBaseUrl(origin);
        console.log(`baseUrl = ${origin}`);
        console.log(`Config: ${this.authStore.getActiveConfigPath()}`);
        return;
      }
      case 'locale':
      case 'lang':
      case 'language': {
        const locale = PamCliConfig.parseLocale(value);
        if (!locale) {
          throw new Error(
            `Unsupported locale \`${value}\`. Use: ${PamCliConfig.SUPPORTED_LOCALES.join(', ')}`
          );
        }
        await this.authStore.setLocale(locale);
        console.log(`locale = ${locale}`);
        try {
          const count = await this.localeCatalog.pull();
          console.log(
            `Locales cached (${count} keys) → ${this.authStore.getLocaleCachePath(locale)}`
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.warn(
            `Locale saved, but failed to pull messages (will retry on error):\n${message}`
          );
        }
        return;
      }
      default:
        throw new Error(
          `Unknown config key \`${key}\`. Supported: domain, url, locale`
        );
    }
  }

  /**
   * @param key - Config key
   */
  public async get(key: string): Promise<void> {
    const normalizedKey = key.trim().toLowerCase();
    const config = await this.authStore.getConfig();
    switch (normalizedKey) {
      case 'domain':
      case 'url':
      case 'baseurl':
      case 'base_url':
        console.log(await this.authStore.getBaseUrl());
        return;
      case 'locale':
      case 'lang':
      case 'language':
        console.log(config.locale);
        return;
      case 'email':
        console.log(config.email || '');
        return;
      case 'path':
        console.log(this.authStore.getActiveConfigPath());
        return;
      default:
        throw new Error(
          `Unknown config key \`${key}\`. Supported: domain, url, locale, email, path`
        );
    }
  }

  /**
   * Prints non-secret config values.
   */
  public async list(): Promise<void> {
    const config = await this.authStore.getConfig();
    const baseUrl = await this.authStore.getBaseUrl();
    console.log(`path     ${this.authStore.getActiveConfigPath()}`);
    console.log(`baseUrl  ${baseUrl}`);
    console.log(`locale   ${config.locale}`);
    console.log(`email    ${config.email || '(none)'}`);
    console.log(`token    ${config.token ? '(set)' : '(none)'}`);
  }
}
