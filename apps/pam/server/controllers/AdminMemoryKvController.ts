import { ExecutorError } from '@qlover/fe-corekit/executor';
import { inject, injectable } from '@shared/container';
import { API_REQUEST_BODY_EMPTY } from '@config/i18n-identifier/api';
import {
  pamMemoryKvPurgeSchema,
  type PamMemoryKvListResult,
  type PamMemoryKvPurgeResult
} from '@schemas/PamMemoryKvSchema';
import { MemoryKvCacheService } from '@server/services/MemoryKvCacheService';

@injectable()
export class AdminMemoryKvController {
  constructor(
    @inject(MemoryKvCacheService)
    protected readonly kv: MemoryKvCacheService
  ) {}

  public async list(query: {
    prefix?: string | null;
  }): Promise<PamMemoryKvListResult> {
    const prefix = typeof query.prefix === 'string' ? query.prefix.trim() : '';
    const entries = await this.kv.listEntries(prefix || undefined);
    return { entries, total: entries.length };
  }

  public async purge(body: unknown): Promise<PamMemoryKvPurgeResult> {
    const parsed = pamMemoryKvPurgeSchema.parse(body);
    if (parsed.all) {
      const removed = await this.kv.count();
      await this.kv.clear();
      return { removed };
    }
    if (parsed.key) {
      await this.kv.removeItem(parsed.key);
      return { removed: 1 };
    }
    if (parsed.prefix) {
      const removed = await this.kv.removeByPrefix(parsed.prefix);
      return { removed };
    }
    throw new ExecutorError(API_REQUEST_BODY_EMPTY);
  }
}
