import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_OIDC_GITHUB_ACTIONS_ENV_MISSING,
  PAMENV_CLI_OIDC_GITHUB_TOKEN_EMPTY,
  PAMENV_CLI_OIDC_GITHUB_TOKEN_HTTP_ERROR
} from '../i18n/identifier/pamenv_cli';
import type { PamCiOidcTokenSourceInterface } from '../interfaces/PamCiOidcTokenSourceInterface';

/**
 * 在 GitHub Actions 内通过 `ACTIONS_ID_TOKEN_REQUEST_*` 取得自定义 audience 的 id_token。
 *
 * 须 `permissions: id-token: write`；仅在 Actions runner 上可用。
 */
export class PamGithubOidcTokenSource implements PamCiOidcTokenSourceInterface {
  /**
   * @override
   */
  public async getIdToken(audience: string): Promise<string> {
    const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL?.trim();
    const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN?.trim();
    if (!requestUrl || !requestToken) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_OIDC_GITHUB_ACTIONS_ENV_MISSING)
      );
    }

    const url = new URL(requestUrl);
    url.searchParams.set('audience', audience);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `bearer ${requestToken}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_OIDC_GITHUB_TOKEN_HTTP_ERROR, {
          status: String(response.status)
        })
      );
    }

    const body = (await response.json()) as { readonly value?: unknown };
    const token =
      typeof body.value === 'string' ? body.value.trim() : '';
    if (!token) {
      throw new Error(PamCliI18n.t(PAMENV_CLI_OIDC_GITHUB_TOKEN_EMPTY));
    }
    return token;
  }
}
