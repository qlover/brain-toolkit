/**
 * CI OIDC 验签契约（GitHub / Vercel 共用）。
 *
 * 各平台实现 JWKS / iss 细节；对外只暴露绑定所需的 `resourceKey`
 *（GitHub = owner/repo，Vercel = team/project）。
 */

export type PamCiOidcClaimsType = {
  readonly iss: string;
  readonly aud: string | readonly string[];
  readonly sub: string;
  /** 与 `pam_ci_oidc_bindings.repository` 对齐的外部资源键。 */
  readonly resourceKey: string;
  readonly exp: number;
};

export interface PamCiOidcVerifierInterface {
  /**
   * 验签并返回统一 claim；失败抛 ExecutorError。
   *
   * @param idToken - 平台签发的 JWT
   * @param audience - 期望的 aud
   */
  verify(idToken: string, audience: string): Promise<PamCiOidcClaimsType>;
}
