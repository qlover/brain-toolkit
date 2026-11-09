/**
 * CI OIDC 验签契约（GitHub / Vercel 共用）。
 *
 * 平台差异收口在实现类：如何从 JWT 抽出绑定键、如何 JWKS 验签。
 * Service 只做编排：peek → 查绑定 → verify → 发票。
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
   * 未验签前从 JWT 抽出绑定键，供查库；解析失败返回 null。
   *
   * @param idToken - 平台签发的 JWT（可未验签）
   */
  peekResourceKey(idToken: string): string | null;

  /**
   * 验签并返回统一 claim；失败抛 ExecutorError。
   *
   * @param idToken - 平台签发的 JWT
   * @param audience - 期望的 aud
   */
  verify(idToken: string, audience: string): Promise<PamCiOidcClaimsType>;
}
