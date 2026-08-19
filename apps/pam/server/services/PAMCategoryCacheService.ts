import { inject, injectable } from '@shared/container';
import { MemoryKvCacheService } from './MemoryKvCacheService';

const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;
const CATEGORY_VERSION_KEY = 'pam:categories:version';

@injectable()
export class PAMCategoryCacheService {
  constructor(
    @inject(MemoryKvCacheService)
    protected readonly kv: MemoryKvCacheService
  ) {}

  public async get(userId?: string): Promise<string[] | null> {
    const version = await this.getVersion();
    const key = this.buildCategoriesKey(userId, version);
    return this.kv.getItem<string[]>(key);
  }

  public async set(
    userId: string | undefined,
    categories: string[]
  ): Promise<void> {
    const version = await this.getVersion();
    const key = this.buildCategoriesKey(userId, version);
    await this.kv.setItem(key, categories, { ttlMs: CATEGORY_CACHE_TTL_MS });
  }

  public async invalidateAll(): Promise<void> {
    const version = await this.getVersion();
    await this.kv.setItem<number>(CATEGORY_VERSION_KEY, version + 1);
  }

  protected async getVersion(): Promise<number> {
    const current = await this.kv.getItem<number>(CATEGORY_VERSION_KEY);
    if (
      typeof current === 'number' &&
      Number.isFinite(current) &&
      current > 0
    ) {
      return Math.floor(current);
    }
    await this.kv.setItem<number>(CATEGORY_VERSION_KEY, 1);
    return 1;
  }

  protected buildCategoriesKey(
    userId: string | undefined,
    version: number
  ): string {
    const scope = userId?.trim() ? `user:${userId.trim()}` : 'anon';
    return `pam:categories:${scope}:v${version}`;
  }
}
