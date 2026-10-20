import { readFile } from 'node:fs/promises';
import { PamCliConfig } from '../config/PamCliConfig';
import {
  createPamCliRuntimeContext,
  type PamCliRuntimeContextType
} from '../config/PamCliRuntimeContext';
import type {
  PamCliAuthStoreInterface,
  PamCliSetLocaleOptionsType
} from '../interfaces/PamCliAuthStoreInterface';
import type {
  PamCliConfigFileType,
  PamCliLocaleSourceType,
  PamCliLocaleType
} from '../interfaces/PamCliTypes';
import { PamCliPrivateFsUtil } from './PamCliPrivateFsUtil';
import { PamCliTokenVault } from './PamCliTokenVault';

/**
 * File-backed auth store under `~/.pam/config.json` or `{cwd}/.pam` with `--local`.
 *
 * Significance: Persists CLI credentials between invocations.
 * Core idea: Non-secret settings in config.json；Bearer token 进 OS 绑定保险库
 * （Windows DPAPI / macOS Keychain / 其它平台 0600 文件）。
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
   * Updates whether the active root is local `.pam` vs `~/.pam` (e.g. `-o`).
   *
   * @param preferLocal - When true, use `{workingDir}/.pam`
   */
  public setPreferLocal(preferLocal: boolean): void {
    this.runtime = {
      ...this.runtime,
      preferLocal
    };
  }

  /**
   * @override
   * @returns Absolute path of the active config file
   */
  public getActiveConfigPath(): string {
    return this.runtime.preferLocal
      ? PamCliConfig.getLocalConfigPath(this.runtime.workingDir)
      : PamCliConfig.getConfigPath();
  }

  /**
   * @override
   * @returns Absolute path of the active pam root (`.pam` dir)
   */
  public getActivePamRoot(): string {
    return this.runtime.preferLocal
      ? PamCliConfig.getLocalRoot(this.runtime.workingDir)
      : PamCliConfig.getHomeRoot();
  }

  /**
   * @override
   */
  public async getConfig(): Promise<PamCliConfigFileType> {
    const base = await this.readConfigFile();
    const vault = await this.ensureVaultMigrated(base);
    return {
      ...base,
      token: vault?.token ?? null,
      email: vault?.email || base.email
    };
  }

  /**
   * @override
   */
  public async setBaseUrl(baseUrl: string): Promise<void> {
    const current = await this.readConfigFile();
    await this.writeConfig({
      ...current,
      baseUrl: PamCliConfig.normalizeOrigin(baseUrl),
      token: null,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * @override
   */
  public async setLocale(
    locale: PamCliLocaleType,
    options?: PamCliSetLocaleOptionsType
  ): Promise<void> {
    const current = await this.readConfigFile();
    const locked =
      options?.locked === true
        ? true
        : options?.locked === false
          ? false
          : current.localeLocked;
    const source: PamCliLocaleSourceType =
      options?.source ||
      (options?.locked === true ? 'manual' : current.localeSource);
    await this.writeConfig({
      ...current,
      locale,
      localeLocked: locked,
      localeSource: source,
      token: null,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * @override
   */
  public async getLocale(): Promise<PamCliLocaleType> {
    const config = await this.readConfigFile();
    return config.locale;
  }

  /**
   * @override
   */
  public async setToken(token: string, email: string): Promise<void> {
    const root = this.getActivePamRoot();
    await PamCliPrivateFsUtil.mkdirPrivate(root);
    await PamCliTokenVault.write(root, { token, email });
    const current = await this.readConfigFile();
    await this.writeConfig({
      ...current,
      token: null,
      email,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * @override
   */
  public async clearToken(): Promise<void> {
    await PamCliTokenVault.clear(this.getActivePamRoot());
    const current = await this.readConfigFile();
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
    const config = await this.readConfigFile();
    return PamCliConfig.normalizeOrigin(config.baseUrl);
  }

  protected async readConfigFile(): Promise<PamCliConfigFileType> {
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
   * 把仍写在 config.json 里的旧 token 迁到保险库，并清空 JSON 中的 token。
   */
  protected async ensureVaultMigrated(
    config: PamCliConfigFileType
  ): Promise<{ token: string; email: string } | null> {
    const root = this.getActivePamRoot();
    const existing = await PamCliTokenVault.read(root);
    if (existing?.token) {
      return existing;
    }

    const legacyToken = config.token?.trim();
    if (!legacyToken) {
      return null;
    }

    const entry = {
      token: legacyToken,
      email: config.email?.trim() || ''
    };
    try {
      await PamCliPrivateFsUtil.mkdirPrivate(root);
      await PamCliTokenVault.write(root, entry);
      await this.writeConfig({
        ...config,
        token: null,
        updatedAt: new Date().toISOString()
      });
    } catch {
      // 迁移失败时仍允许用旧 JSON 登录，避免锁死。
      return entry;
    }
    return entry;
  }

  protected normalizeConfig(
    parsed: Partial<PamCliConfigFileType>
  ): PamCliConfigFileType {
    const locale =
      typeof parsed.locale === 'string'
        ? PamCliConfig.parseLocale(parsed.locale)
        : null;
    const localeSource: PamCliLocaleSourceType =
      parsed.localeSource === 'manual' ||
      parsed.localeSource === 'browser' ||
      parsed.localeSource === 'default'
        ? parsed.localeSource
        : 'default';
    return {
      baseUrl: parsed.baseUrl || PamCliConfig.DEFAULT_BASE_URL,
      token: parsed.token ?? null,
      email: parsed.email ?? null,
      updatedAt: parsed.updatedAt || new Date(0).toISOString(),
      locale: locale || PamCliConfig.DEFAULT_LOCALE,
      localeLocked: parsed.localeLocked === true,
      localeSource
    };
  }

  protected async writeConfig(config: PamCliConfigFileType): Promise<void> {
    await PamCliPrivateFsUtil.mkdirPrivate(this.getActivePamRoot());
    // token 只进保险库，config.json 永久写 null。
    const safe: PamCliConfigFileType = {
      ...config,
      token: null
    };
    const configPath = this.getActiveConfigPath();
    // 旧 config 可能是 umask 0644；迁出 token 前先收紧，否则 writePrivateFile 会拒绝覆盖。
    await PamCliPrivateFsUtil.ensurePrivateFileMode(configPath);
    await PamCliPrivateFsUtil.writePrivateFile(
      configPath,
      `${JSON.stringify(safe, null, 2)}\n`
    );
  }
}
