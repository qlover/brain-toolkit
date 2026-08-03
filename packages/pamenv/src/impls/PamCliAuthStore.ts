import { readFile } from 'node:fs/promises';
import { PamCliConfig } from '../config/PamCliConfig';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCliConfigFileType } from '../interfaces/PamCliTypes';
import { PamCliPrivateFsUtil } from './PamCliPrivateFsUtil';

/**
 * File-backed auth store under `~/.pam/config.json`.
 *
 * Significance: Persists CLI credentials between invocations.
 * Core idea: JSON file with baseUrl + token, written as `0600`.
 * Main function: Load and mutate CLI config.
 * Main purpose: Enable login once, reuse token for pull/export.
 *
 * @example
 * const store = new PamCliAuthStore();
 * await store.setToken(token, email);
 */
export class PamCliAuthStore implements PamCliAuthStoreInterface {
  /**
   * @override
   */
  public async getConfig(): Promise<PamCliConfigFileType> {
    try {
      const raw = await readFile(PamCliConfig.getConfigPath(), 'utf8');
      const parsed = JSON.parse(raw) as Partial<PamCliConfigFileType>;
      return {
        baseUrl: parsed.baseUrl || PamCliConfig.DEFAULT_BASE_URL,
        token: parsed.token ?? null,
        email: parsed.email ?? null,
        updatedAt: parsed.updatedAt || new Date(0).toISOString()
      };
    } catch {
      return {
        baseUrl: PamCliConfig.DEFAULT_BASE_URL,
        token: null,
        email: null,
        updatedAt: new Date(0).toISOString()
      };
    }
  }

  /**
   * @override
   */
  public async setBaseUrl(baseUrl: string): Promise<void> {
    const current = await this.getConfig();
    await this.writeConfig({
      ...current,
      baseUrl: this.normalizeBaseUrl(baseUrl),
      updatedAt: new Date().toISOString()
    });
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
    const config = await this.getConfig();
    return config.baseUrl;
  }

  protected normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.trim().replace(/\/+$/, '');
  }

  protected async writeConfig(config: PamCliConfigFileType): Promise<void> {
    await PamCliPrivateFsUtil.mkdirPrivate(PamCliConfig.getHomeRoot());
    await PamCliPrivateFsUtil.writePrivateFile(
      PamCliConfig.getConfigPath(),
      `${JSON.stringify(config, null, 2)}\n`
    );
  }
}
