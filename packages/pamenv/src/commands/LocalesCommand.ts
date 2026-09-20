import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_LOCALES_PULLED,
  PAMENV_CLI_LOCALES_PULLING
} from '../i18n/identifier/pamenv_cli';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';

/**
 * `pamenv locales pull` — 从 PAM 重新拉取 `api:*` 错误文案到内存（不写本地）。
 */
export class LocalesCommand {
  constructor(protected readonly authStore: PamCliAuthStoreInterface) {}

  public async pull(): Promise<void> {
    await PamCliI18n.syncFromStore(this.authStore);
    const locale = await this.authStore.getLocale();
    const baseUrl = await this.authStore.getBaseUrl();
    console.log(
      PamCliI18n.t(PAMENV_CLI_LOCALES_PULLING, { locale, baseUrl })
    );
    const count = await PamCliI18n.hydrateFromApi(this.authStore);
    console.log(
      PamCliI18n.t(PAMENV_CLI_LOCALES_PULLED, {
        count,
        locale,
        baseUrl
      })
    );
  }
}
