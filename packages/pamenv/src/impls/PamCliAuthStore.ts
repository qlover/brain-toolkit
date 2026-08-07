import { readFile } from 'node:fs/promises';
import { PamCliConfig } from '../config/PamCliConfig';
import {
  createPamCliRuntimeContext,
  type PamCliRuntimeContextType
} from '../config/PamCliRuntimeContext';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type {
  PamCliConfigFileType,
  PamCliLocaleType
} from '../interfaces/PamCliTypes';
import { PamCliPrivateFsUtil } from './PamCliPrivateFsUtil';

/**
 * File-backed auth store under `~/.pam/config.json` or `{cwd}/.pam` with `--local`.
 *
 * Significance: Persists CLI credentials between invocations.
 * Core idea: JSON file with baseUrl + token + locale, written as `0600`.
 * Main function: Load and mutate CLI config; honor url override.
 * Main purpose: Enable login once, reuse token for pull/export.
 *
 * @example
 * const store = new PamCliAuthStore({ preferLocal: true, workingDir: process.cwd() });
 * await store.setToken(token, email);
 */
export class PamCliAuthStore implements PamCliAuthStoreInterface {
  protected runtime: PamCliRuntimeContextType;

  constructor(runtime?: Partial<PamCliRuntimeContextType>) {
    this.runtime = createPamCliRuntimeContext(runtime);
  }

  /**
   * Updates working directory (e.g. when a command passes `-o` with `--local`).
   *
   * @param workingDir - Absolute or relative directory
   */
  public setWorkingDir(workingDir: string): void {
    this.runtime = {
      ...this.runtime,
      workingDir
    };
  }

  /**
   * @returns Absolute path of the active config file
   */
  public getActiveConfigPath(): string {
    return this.runtime.preferLocal
      ? PamCliConfig.getLocalConfigPath(this.runtime.workingDir)
      : PamCliConfig.getConfigPath();
  }

  /**
   * @returns Absolute path of the active pam root (`.pam` dir)
   */
  public getActivePamRoot(): string {
    return this.runtime.preferLocal
      ? PamCliConfig.getLocalRoot(this.runtime.workingDir)
      : PamCliConfig.getHomeRoot();
  }

  /**
   * @returns Absolute locales cache directory for the active root
   */
  public getActiveLocalesRoot(): string {
    return this.runtime.preferLocal
      ? PamCliConfig.getLocalLocalesRoot(this.runtime.workingDir)
      : PamCliConfig.getLocalesRoot();
  }

  /**
   * @param locale - Locale code
   * @returns Absolute cached locale JSON path
   */
  public getLocaleCachePath(locale: PamCliLocaleType): string {
    return this.runtime.preferLocal
      ? PamCliConfig.getLocalLocaleCachePath(this.runtime.workingDir, locale)
      : PamCliConfig.getLocaleCachePath(locale);
  }

  /**
   * @override
   */
  public async getConfig(): Promise<PamCliConfigFileType> {
    try {
      const raw = await readFile(this.getActiveConfigPath(), 'utf8');
      const parsed = JSON.parse(raw) as Partial<PamCliConfigFileType>;
      return this.normalizeConfig(parsed);
    } catch {
      // `--local` must not silently fall back to ~/.pam credentials.
      return this.normalizeConfig({});
    }
  }

  /**
   * @override
   */
  public async setBaseUrl(baseUrl: string): Promise<void> {
    const current = await this.getConfig();
    await this.writeConfig({
      ...current,
      baseUrl: PamCliConfig.normalizeOrigin(baseUrl),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * @override
   */
  public async setLocale(locale: PamCliLocaleType): Promise<void> {
    const current = await this.getConfig();
    await this.writeConfig({
      ...current,
      locale,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * @override
   */
  public async getLocale(): Promise<PamCliLocaleType> {
    const config = await this.getConfig();
    return config.locale;
  }

  /**
   * @override
   */
  public async setToken(token: string, email: string): Promise<void> {
    const current = await this.getConfig();
    await this.writeConfig({
      ...current,
      token,
      email,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * @override
   */
  public async clearToken(): Promise<void> {
    const current = await this.getConfig();
    await this.writeConfig({
      ...current,
      token: null,
      email: null,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * @override
   */
  public async getToken(): Promise<string | null> {
    const config = await this.getConfig();
    return config.token;
  }

  /**
   * @override
   */
  public async getBaseUrl(): Promise<string> {
    if (this.runtime.urlOverride?.trim()) {
      return PamCliConfig.normalizeOrigin(this.runtime.urlOverride);
    }
    const config = await this.getConfig();
    return PamCliConfig.normalizeOrigin(config.baseUrl);
  }

  protected normalizeConfig(
    parsed: Partial<PamCliConfigFileType>
  ): PamCliConfigFileType {
    const locale =
      typeof parsed.locale === 'string'
        ? PamCliConfig.parseLocale(parsed.locale)
        : null;
    return {
      baseUrl: parsed.baseUrl || PamCliConfig.DEFAULT_BASE_URL,
      token: parsed.token ?? null,
      email: parsed.email ?? null,
      updatedAt: parsed.updatedAt || new Date(0).toISOString(),
      locale: locale || PamCliConfig.DEFAULT_LOCALE
    };
  }

  protected async writeConfig(config: PamCliConfigFileType): Promise<void> {
    await PamCliPrivateFsUtil.mkdirPrivate(this.getActivePamRoot());
    await PamCliPrivateFsUtil.writePrivateFile(
      this.getActiveConfigPath(),
      `${JSON.stringify(config, null, 2)}\n`
    );
  }
}
