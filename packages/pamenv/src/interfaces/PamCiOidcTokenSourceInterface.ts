/**
 * CI OIDC：从平台取原始 id_token。
 *
 * 各平台（Vercel / GitHub…）实现如何拿到 JWT；换票与注入由上层编排。
 */

export type PamCiOidcProviderType = 'vercel' | 'github';

export interface PamCiOidcTokenSourceInterface {
  /**
   * 取得平台 id_token。
   *
   * @param audience - 期望 aud（通常为 PAM SITE_URL）
   */
  getIdToken(audience: string): Promise<string>;
}
