import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_OIDC_EXCHANGED,
  PAMENV_CLI_OIDC_NEED_BASE_URL,
  PAMENV_CLI_OIDC_PROVIDER_UNSUPPORTED
} from '../i18n/identifier/pamenv_cli';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCiOidcProviderType } from '../interfaces/PamCiOidcTokenSourceInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import { PamCiOidcTokenSourceRegistry } from './PamCiOidcTokenSourceRegistry';

/**
 * CI OIDC 引导：取平台 id_token → 换 PAM 短票 → 写入 `PAMENV_TOKEN`。
 *
 * 供 `pamenv run --oidc` 与 `pamenv oidc exchange` 共用。
 */
export class PamCiOidcBootstrap {
  constructor(
    protected readonly apiClient: PamCliApiClientInterface,
    protected readonly authStore: PamCliAuthStoreInterface,
    protected readonly sources: PamCiOidcTokenSourceRegistry = new PamCiOidcTokenSourceRegistry()
  ) {}

  /**
   * 解析 audience：`PAM_OIDC_AUD` → `getBaseUrl()`。
   */
  public async resolveAudience(): Promise<string> {
    const fromEnv = process.env[PamCliConfig.ENV_OIDC_AUD]?.trim();
    if (fromEnv) {
      return PamCliConfig.normalizeOrigin(fromEnv);
    }
    return PamCliConfig.normalizeOrigin(await this.authStore.getBaseUrl());
  }

  /**
   * 换票并设置 `process.env.PAMENV_TOKEN`（不写盘）。
   *
   * @param provider - 平台
   * @param debug - 是否在 stderr 打一行成功提示（不含 token）
   * @returns 短票与过期时间
   */
  public async ensurePamenvToken(
    provider: PamCiOidcProviderType,
    debug = true
  ): Promise<{ readonly token: string; readonly expiresAt: string }> {
    const baseUrl = PamCliConfig.normalizeOrigin(
      await this.authStore.getBaseUrl()
    );
    if (!baseUrl) {
      throw new Error(PamCliI18n.t(PAMENV_CLI_OIDC_NEED_BASE_URL));
    }

    const audience = await this.resolveAudience();
    const idToken = await this.sources.require(provider).getIdToken(audience);
    const issued = await this.apiClient.exchangeOidc(
      provider,
      idToken,
      baseUrl
    );

    process.env[PamCliConfig.ENV_TOKEN] = issued.token;

    if (debug) {
      console.error(
        PamCliI18n.t(PAMENV_CLI_OIDC_EXCHANGED, {
          provider,
          audience,
          expiresAt: issued.expiresAt
        })
      );
    }

    return issued;
  }

  /**
   * 解析 CLI `--oidc` / `--provider` 字符串。
   */
  public static parseProvider(raw: string): PamCiOidcProviderType {
    const value = raw.trim().toLowerCase();
    if (value === 'vercel' || value === 'github') {
      return value;
    }
    throw new Error(
      PamCliI18n.t(PAMENV_CLI_OIDC_PROVIDER_UNSUPPORTED, {
        provider: raw
      })
    );
  }
}
