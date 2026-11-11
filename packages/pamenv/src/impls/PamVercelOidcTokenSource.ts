import { PamCliI18n } from '../i18n/PamCliI18n';
import { PAMENV_CLI_OIDC_VERCEL_PACKAGE_MISSING } from '../i18n/identifier/pamenv_cli';
import type { PamCiOidcTokenSourceInterface } from '../interfaces/PamCiOidcTokenSourceInterface';

/**
 * 通过 `@vercel/oidc` 取得带自定义 audience 的 id_token。
 *
 * `@vercel/oidc` 为 pamenv-cli 正式依赖；若解析失败仍抛出明确错误便于排错。
 */
export class PamVercelOidcTokenSource implements PamCiOidcTokenSourceInterface {
  /**
   * @override
   */
  public async getIdToken(audience: string): Promise<string> {
    let getVercelOidcToken: (opts: {
      audience: string;
    }) => Promise<string>;
    try {
      const mod = await import('@vercel/oidc');
      getVercelOidcToken = mod.getVercelOidcToken;
    } catch {
      throw new Error(PamCliI18n.t(PAMENV_CLI_OIDC_VERCEL_PACKAGE_MISSING));
    }

    const token = await getVercelOidcToken({ audience });
    const trimmed = token?.trim();
    if (!trimmed) {
      throw new Error('Vercel OIDC returned an empty token');
    }
    return trimmed;
  }
}
