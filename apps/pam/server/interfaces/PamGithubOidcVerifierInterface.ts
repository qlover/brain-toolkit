/**
 * 校验 GitHub Actions OIDC id_token。
 *
 * 用 JWKS 验签并核对 iss / aud / exp，返回 repository 等 claim。
 */

export type PamGithubOidcClaimsType = {
  readonly iss: string;
  readonly aud: string | readonly string[];
  readonly sub: string;
  readonly repository: string;
  readonly repository_owner?: string;
  readonly ref?: string;
  readonly workflow?: string;
  readonly run_id?: string;
  readonly exp: number;
};

export interface PamGithubOidcVerifierInterface {
  /**
   * 验签并返回 claim；失败抛 ExecutorError / Error。
   *
   * @param idToken - Actions 签发的 JWT
   * @param audience - 期望的 aud
   */
  verify(idToken: string, audience: string): Promise<PamGithubOidcClaimsType>;
}
