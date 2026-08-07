import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import { PamCliLocaleCatalog } from '../impls/PamCliLocaleCatalog';

/**
 * `pamenv locales pull` — refresh cached PAM locale JSON.
 */
export class LocalesCommand {
  constructor(
    protected readonly authStore: PamCliAuthStoreInterface,
    protected readonly localeCatalog: PamCliLocaleCatalog
  ) {}

  public async pull(): Promise<void> {
    const locale = await this.authStore.getLocale();
    const baseUrl = await this.authStore.getBaseUrl();
    console.log(`Pulling locales locale=${locale} from ${baseUrl} ...`);
    const count = await this.localeCatalog.pull();
    console.log(
      `Cached ${count} keys → ${this.authStore.getLocaleCachePath(locale)}`
    );
  }
}
