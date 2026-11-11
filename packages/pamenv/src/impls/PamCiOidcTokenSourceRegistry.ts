import type {
  PamCiOidcProviderType,
  PamCiOidcTokenSourceInterface
} from '../interfaces/PamCiOidcTokenSourceInterface';
import { PamCliI18n } from '../i18n/PamCliI18n';
import { PAMENV_CLI_OIDC_PROVIDER_UNSUPPORTED } from '../i18n/identifier/pamenv_cli';
import { PamGithubOidcTokenSource } from './PamGithubOidcTokenSource';
import { PamVercelOidcTokenSource } from './PamVercelOidcTokenSource';

/**
 * 按 provider 选型 OIDC token source（表分发，禁止平行 if 分支堆叠）。
 */
export class PamCiOidcTokenSourceRegistry {
  protected readonly sources: Readonly<
    Partial<Record<PamCiOidcProviderType, PamCiOidcTokenSourceInterface>>
  >;

  constructor(
    sources?: Partial<
      Record<PamCiOidcProviderType, PamCiOidcTokenSourceInterface>
    >
  ) {
    this.sources = sources ?? {
      vercel: new PamVercelOidcTokenSource(),
      github: new PamGithubOidcTokenSource()
    };
  }

  /**
   * @param provider - CI 平台
   */
  public require(provider: PamCiOidcProviderType): PamCiOidcTokenSourceInterface {
    const source = this.sources[provider];
    if (!source) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_OIDC_PROVIDER_UNSUPPORTED, {
          provider
        })
      );
    }
    return source;
  }
}
