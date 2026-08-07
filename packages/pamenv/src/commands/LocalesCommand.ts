import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  PAMENV_CLI_LOCALES_PULLED,
  PAMENV_CLI_LOCALES_PULLING
} from '../i18n/identifier/pamenv_cli';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import type { PamCliLocaleCatalog } from '../impls/PamCliLocaleCatalog';

/**
 * `pamenv locales pull` — refresh PAM `api:` locale messages in config.json.
 */
export class LocalesCommand {
  constructor(
    protected readonly authStore: PamCliAuthStoreInterface,
    protected readonly localeCatalog: PamCliLocaleCatalog
  ) {}

  public async pull(): Promise<void> {
    await PamCliI18n.syncFromStore(this.authStore);
    const locale = await this.authStore.getLocale();
    const baseUrl = await this.authStore.getBaseUrl();
    console.log(
      PamCliI18n.t(PAMENV_CLI_LOCALES_PULLING, { locale, baseUrl })
    );
    const count = await this.localeCatalog.pull();
    console.log(
      PamCliI18n.t(PAMENV_CLI_LOCALES_PULLED, {
        count,
        path: this.authStore.getActiveConfigPath()
      })
    );
  }
}
