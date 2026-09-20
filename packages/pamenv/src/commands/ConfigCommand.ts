import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_CONFIG_BASE_URL_SET,
  PAMENV_CLI_CONFIG_EMAIL_NONE,
  PAMENV_CLI_CONFIG_LIST_BASE_URL,
  PAMENV_CLI_CONFIG_LIST_EMAIL,
  PAMENV_CLI_CONFIG_LIST_LOCALE,
  PAMENV_CLI_CONFIG_LIST_LOCALE_LOCKED,
  PAMENV_CLI_CONFIG_LIST_PATH,
  PAMENV_CLI_CONFIG_LIST_TOKEN_NONE,
  PAMENV_CLI_CONFIG_LIST_TOKEN_SET,
  PAMENV_CLI_CONFIG_LOCALE_SET,
  PAMENV_CLI_CONFIG_MISSING_VALUE,
  PAMENV_CLI_CONFIG_PATH,
  PAMENV_CLI_CONFIG_UNKNOWN_KEY,
  PAMENV_CLI_CONFIG_UNSUPPORTED_LOCALE,
  PAMENV_CLI_LOCALES_PULL_FAILED
} from '../i18n/identifier/pamenv_cli';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';

/**
 * `pamenv config` — get/set/list persisted CLI settings.
 *
 * Significance: Persist default domain and locale without repeating flags.
 * Core idea: Small key/value surface over `.pam/config.json`.
 * Main function: set domain/url/locale; list active values.
 * Main purpose: Local PAM testing and localized API errors.
 */
export class ConfigCommand {
  constructor(protected readonly authStore: PamCliAuthStoreInterface) {}

  /**
   * Best-effort refresh of locale messages from PAM into memory.
   * Logs a warning on failure; never throws.
   */
  protected async hydrateLocalesBestEffort(): Promise<void> {
    try {
      await PamCliI18n.hydrateFromApi(this.authStore);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        PamCliI18n.t(PAMENV_CLI_LOCALES_PULL_FAILED, { message })
      );
    }
  }

  /**
   * @param key - Config key
   * @param value - Raw value
   */
  public async set(key: string, value: string): Promise<void> {
    await PamCliI18n.syncFromStore(this.authStore);
    const normalizedKey = key.trim().toLowerCase();
    if (!value?.trim()) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_CONFIG_MISSING_VALUE, { key: normalizedKey })
      );
    }

    switch (normalizedKey) {
      case 'domain':
      case 'url':
      case 'baseurl':
      case 'base_url': {
        const origin = PamCliConfig.normalizeOrigin(value);
        await this.authStore.setBaseUrl(origin);
        console.log(
          PamCliI18n.t(PAMENV_CLI_CONFIG_BASE_URL_SET, { url: origin })
        );
        console.log(
          PamCliI18n.t(PAMENV_CLI_CONFIG_PATH, {
            path: this.authStore.getActiveConfigPath()
          })
        );
        await this.hydrateLocalesBestEffort();
        return;
      }
      case 'locale':
      case 'lang':
      case 'language': {
        const locale = PamCliConfig.parseLocale(value);
        if (!locale) {
          throw new Error(
            PamCliI18n.t(PAMENV_CLI_CONFIG_UNSUPPORTED_LOCALE, {
              value,
              supported: PamCliConfig.SUPPORTED_LOCALES.join(', ')
            })
          );
        }
        await this.authStore.setLocale(locale, {
          locked: true,
          source: 'manual'
        });
        PamCliI18n.setLocale(locale);
        await this.hydrateLocalesBestEffort();
        console.log(PamCliI18n.t(PAMENV_CLI_CONFIG_LOCALE_SET, { locale }));
        return;
      }
      default:
        throw new Error(
          PamCliI18n.t(PAMENV_CLI_CONFIG_UNKNOWN_KEY, {
            key,
            supported: 'domain, url, locale'
          })
        );
    }
  }

  /**
   * @param key - Config key
   */
  public async get(key: string): Promise<void> {
    await PamCliI18n.syncFromStore(this.authStore);
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
          PamCliI18n.t(PAMENV_CLI_CONFIG_UNKNOWN_KEY, {
            key,
            supported: 'domain, url, locale, email, path'
          })
        );
    }
  }

  /**
   * Prints non-secret config values.
   */
  public async list(): Promise<void> {
    await PamCliI18n.syncFromStore(this.authStore);
    const config = await this.authStore.getConfig();
    const baseUrl = await this.authStore.getBaseUrl();
    console.log(
      PamCliI18n.t(PAMENV_CLI_CONFIG_LIST_PATH, {
        path: this.authStore.getActiveConfigPath()
      })
    );
    console.log(
      PamCliI18n.t(PAMENV_CLI_CONFIG_LIST_BASE_URL, { url: baseUrl })
    );
    console.log(
      PamCliI18n.t(PAMENV_CLI_CONFIG_LIST_LOCALE, {
        locale: config.locale,
        locked: config.localeLocked
          ? ` ${PamCliI18n.t(PAMENV_CLI_CONFIG_LIST_LOCALE_LOCKED).trim()}`
          : ''
      })
    );
    console.log(
      PamCliI18n.t(PAMENV_CLI_CONFIG_LIST_EMAIL, {
        email: config.email || PamCliI18n.t(PAMENV_CLI_CONFIG_EMAIL_NONE)
      })
    );
    console.log(
      config.token
        ? PamCliI18n.t(PAMENV_CLI_CONFIG_LIST_TOKEN_SET)
        : PamCliI18n.t(PAMENV_CLI_CONFIG_LIST_TOKEN_NONE)
    );
  }
}
