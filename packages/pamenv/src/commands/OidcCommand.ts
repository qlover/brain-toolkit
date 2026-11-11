import { PamCiOidcBootstrap } from '../impls/PamCiOidcBootstrap';
import type { PamCliApiClientInterface } from '../interfaces/PamCliApiClientInterface';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCiOidcProviderType } from '../interfaces/PamCiOidcTokenSourceInterface';

/**
 * `pamenv oidc exchange` — 仅换票，便于 CI 排错。
 *
 * 成功后 `PAMENV_TOKEN` 已在当前进程；默认不把 token 打到 stdout（避免进日志）。
 * 传 `printToken: true` 时仅向 stdout 写一行 token。
 */
export class OidcCommand {
  constructor(
    protected readonly apiClient: PamCliApiClientInterface,
    protected readonly authStore: PamCliAuthStoreInterface
  ) {}

  /**
   * @param provider - 平台
   * @param printToken - 是否把 token 打到 stdout
   */
  public async exchange(
    provider: PamCiOidcProviderType,
    printToken = false
  ): Promise<{ readonly token: string; readonly expiresAt: string }> {
    const issued = await new PamCiOidcBootstrap(
      this.apiClient,
      this.authStore
    ).ensurePamenvToken(provider, true);
    if (printToken) {
      process.stdout.write(`${issued.token}\n`);
    }
    return issued;
  }
}
