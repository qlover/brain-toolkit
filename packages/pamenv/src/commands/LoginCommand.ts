import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { input, password } from '@inquirer/prompts';
import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_EMAIL_PASSWORD_REQUIRED,
  PAMENV_CLI_LOCALES_CACHED,
  PAMENV_CLI_LOCALES_PULL_FAILED,
  PAMENV_CLI_LOGIN_BROWSER_OPEN_FAILED,
  PAMENV_CLI_LOGIN_CONFIG_SAVED,
  PAMENV_CLI_LOGIN_DENIED,
  PAMENV_CLI_LOGIN_EXPIRED,
  PAMENV_CLI_LOGIN_EXPIRES,
  PAMENV_CLI_LOGIN_LOCALE_SYNCED,
  PAMENV_CLI_LOGIN_OPEN_BROWSER,
  PAMENV_CLI_LOGIN_SUCCESS,
  PAMENV_CLI_LOGIN_TIMEOUT,
  PAMENV_CLI_LOGIN_USER_CODE,
  PAMENV_CLI_LOGIN_WAITING,
  PAMENV_CLI_PROMPT_BASE_URL,
  PAMENV_CLI_PROMPT_EMAIL,
  PAMENV_CLI_PROMPT_PASSWORD,
  PAMENV_CLI_USING_CONFIG
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCliLocaleType } from '../interfaces/PamCliTypes';
import type { PamCliLocaleCatalog } from '../impls/PamCliLocaleCatalog';

const execFileAsync = promisify(execFile);

/**
 * Interactive `pamenv login` command.
 *
 * Significance: Establishes CLI bearer credentials.
 * Core idea: Browser device-code by default; password as fallback.
 * Main function: Persist token to `~/.pam/config.json`.
 * Main purpose: Auth UX aligned with common CLI tools (gh, etc.).
 */
export class LoginCommand {
  constructor(
    protected readonly authStore: PamCliAuthStoreInterface,
    protected readonly apiClient: PamCliApiClientInterface,
    protected readonly localeCatalog?: PamCliLocaleCatalog
  ) {}

  /**
   * Runs login. Browser flow is default; use `password: true` for email/password.
   *
   * @param options - Optional overrides
   */
  public async run(options?: {
    readonly url?: string;
    readonly email?: string;
    readonly password?: string | boolean;
    readonly browser?: boolean;
  }): Promise<void> {
    await PamCliI18n.syncFromStore(this.authStore);
    const current = await this.authStore.getConfig();
    console.log(
      PamCliI18n.t(PAMENV_CLI_USING_CONFIG, {
        path: this.authStore.getActiveConfigPath()
      })
    );

    const baseUrl = PamCliConfig.normalizeOrigin(
      options?.url?.trim() ||
        (await input({
          message: PamCliI18n.t(PAMENV_CLI_PROMPT_BASE_URL),
          default: current.baseUrl || PamCliConfig.DEFAULT_BASE_URL
        }))
    );

    await this.authStore.setBaseUrl(baseUrl);

    const usePassword =
      options?.password === true ||
      typeof options?.password === 'string' ||
      Boolean(options?.email) ||
      options?.browser === false;

    if (usePassword) {
      await this.runPasswordLogin(baseUrl, options);
      await this.pullApiLocalesBestEffort();
      return;
    }

    await this.runBrowserLogin(baseUrl);
  }

  protected async runPasswordLogin(
    baseUrl: string,
    options?: {
      readonly email?: string;
      readonly password?: string | boolean;
    }
  ): Promise<void> {
    const current = await this.authStore.getConfig();
    const email =
      options?.email?.trim() ||
      (await input({
        message: PamCliI18n.t(PAMENV_CLI_PROMPT_EMAIL),
        default: current.email || undefined
      }));
    const pwd =
      typeof options?.password === 'string'
        ? options.password
        : await password({
            message: PamCliI18n.t(PAMENV_CLI_PROMPT_PASSWORD),
            mask: '*'
          });

    if (!email.trim() || !pwd) {
      throw new Error(PamCliI18n.t(PAMENV_CLI_EMAIL_PASSWORD_REQUIRED));
    }

    const result = await this.apiClient.createCliToken(baseUrl, email, pwd);
    await this.persistLogin(result.token, result.email, result.expiresAt);
  }

  protected async runBrowserLogin(baseUrl: string): Promise<void> {
    const device = await this.apiClient.createDeviceCode(baseUrl);

    console.log('');
    console.log(PamCliI18n.t(PAMENV_CLI_LOGIN_OPEN_BROWSER));
    console.log(`  ${device.verification_uri_complete}`);
    console.log('');
    console.log(
      PamCliI18n.t(PAMENV_CLI_LOGIN_USER_CODE, { code: device.user_code })
    );
    console.log(PamCliI18n.t(PAMENV_CLI_LOGIN_WAITING));

    try {
      await this.openBrowser(device.verification_uri_complete);
    } catch {
      console.log(PamCliI18n.t(PAMENV_CLI_LOGIN_BROWSER_OPEN_FAILED));
    }

    const deadline = Date.now() + device.expires_in * 1000;
    const intervalMs = Math.max(device.interval, 1) * 1000;

    while (Date.now() < deadline) {
      await this.sleep(intervalMs);
      const polled = await this.apiClient.pollDeviceToken(
        baseUrl,
        device.device_code
      );

      if (polled.status === 'pending') {
        process.stdout.write('.');
        continue;
      }

      if (polled.status === 'denied') {
        throw new Error(PamCliI18n.t(PAMENV_CLI_LOGIN_DENIED));
      }

      if (polled.status === 'expired') {
        throw new Error(PamCliI18n.t(PAMENV_CLI_LOGIN_EXPIRED));
      }

      if (polled.status === 'approved') {
        console.log('');
        await this.applyBrowserLocale(polled.locale);
        await this.persistLogin(
          polled.token,
          polled.email,
          polled.expiresAt
        );
        await this.pullApiLocalesBestEffort();
        return;
      }
    }

    throw new Error(PamCliI18n.t(PAMENV_CLI_LOGIN_TIMEOUT));
  }

  /**
   * Applies browser locale when config is not manually locked.
   *
   * @param locale - Optional locale from device poll
   */
  protected async applyBrowserLocale(
    locale: PamCliLocaleType | undefined
  ): Promise<void> {
    if (!locale) {
      return;
    }
    const config = await this.authStore.getConfig();
    if (config.localeLocked) {
      return;
    }
    if (config.locale === locale) {
      PamCliI18n.setLocale(locale);
      return;
    }
    await this.authStore.setLocale(locale, {
      locked: false,
      source: 'browser'
    });
    PamCliI18n.setLocale(locale);
    console.log(
      PamCliI18n.t(PAMENV_CLI_LOGIN_LOCALE_SYNCED, { locale })
    );
  }

  protected async pullApiLocalesBestEffort(): Promise<void> {
    if (!this.localeCatalog) {
      return;
    }
    try {
      const count = await this.localeCatalog.pull();
      console.log(
        PamCliI18n.t(PAMENV_CLI_LOCALES_CACHED, {
          count,
          path: this.authStore.getActiveConfigPath()
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        PamCliI18n.t(PAMENV_CLI_LOCALES_PULL_FAILED, { message })
      );
    }
  }

  protected async persistLogin(
    token: string,
    email: string,
    expiresAt: string
  ): Promise<void> {
    await this.authStore.setToken(token, email);
    console.log(PamCliI18n.t(PAMENV_CLI_LOGIN_SUCCESS, { email }));
    console.log(PamCliI18n.t(PAMENV_CLI_LOGIN_EXPIRES, { expiresAt }));
    console.log(
      PamCliI18n.t(PAMENV_CLI_LOGIN_CONFIG_SAVED, {
        path: this.authStore.getActiveConfigPath()
      })
    );
  }

  protected async openBrowser(url: string): Promise<void> {
    const platform = process.platform;
    if (platform === 'darwin') {
      await execFileAsync('open', [url]);
      return;
    }
    if (platform === 'win32') {
      await execFileAsync('cmd', ['/c', 'start', '', url]);
      return;
    }
    await execFileAsync('xdg-open', [url]);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
