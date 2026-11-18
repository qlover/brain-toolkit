/**
 * 解析邮箱魔法链接回调地址里的登录材料。
 *
 * implicit 会话在 hash（个别版本在 query）里，旧 PKCE 邮件仍可能带 `?code=`。
 * 回调页先调用 {@link EmailMagicLinkCallbackResolver.resolve}，再立刻清掉地址栏里的令牌。
 */

const CREDENTIAL_QUERY_KEYS = [
  'access_token',
  'refresh_token',
  'expires_in',
  'expires_at',
  'token_type',
  'provider_token',
  'provider_refresh_token',
  'code'
] as const;

export type EmailMagicLinkCallbackType =
  | {
      readonly kind: 'session';
      readonly accessToken: string;
      readonly refreshToken: string;
      readonly expiresIn: string;
      readonly tokenType: string;
    }
  | {
      readonly kind: 'code';
      readonly code: string;
    }
  | {
      readonly kind: 'error';
      readonly message: string;
    }
  | {
      readonly kind: 'missing';
    };

export class EmailMagicLinkCallbackResolver {
  /**
   * 从 search 与 hash 取出本次回调该怎么登录。
   *
   * 有 error 时不再继续换票。session 优先于 PKCE `code`，避免地址里残留的 code 盖住已签发的令牌。
   */
  public resolve(search: string, hash: string): EmailMagicLinkCallbackType {
    const query = new URLSearchParams(this.stripPrefix(search, '?'));
    const fragment = new URLSearchParams(this.stripPrefix(hash, '#'));

    const error = query.get('error') || fragment.get('error');
    if (error) {
      const description =
        query.get('error_description') ||
        fragment.get('error_description') ||
        '';
      return {
        kind: 'error',
        message: `${error} ${description}`.trim()
      };
    }

    const accessToken =
      fragment.get('access_token') || query.get('access_token');
    const refreshToken =
      fragment.get('refresh_token') || query.get('refresh_token');
    if (accessToken && refreshToken) {
      return {
        kind: 'session',
        accessToken,
        refreshToken,
        expiresIn:
          fragment.get('expires_in') || query.get('expires_in') || '3600',
        tokenType:
          fragment.get('token_type') || query.get('token_type') || 'bearer'
      };
    }

    const code = query.get('code')?.trim() ?? '';
    if (code) {
      return { kind: 'code', code };
    }

    return { kind: 'missing' };
  }

  /**
   * 去掉 hash 和 query 里的令牌 / 授权码，避免刷新页面时再次提交。
   *
   * @returns 可直接交给 `history.replaceState` 的 path + search
   */
  public clearCredentials(href: string): string {
    const url = new URL(href);
    url.hash = '';
    for (const key of CREDENTIAL_QUERY_KEYS) {
      url.searchParams.delete(key);
    }
    return `${url.pathname}${url.search}`;
  }

  protected stripPrefix(value: string, prefix: string): string {
    return value.startsWith(prefix) ? value.slice(prefix.length) : value;
  }
}
