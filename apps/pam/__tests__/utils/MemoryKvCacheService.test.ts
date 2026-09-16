import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryKvCacheService } from '@server/services/MemoryKvCacheService';

describe('MemoryKvCacheService', () => {
  beforeEach(async () => {
    await new MemoryKvCacheService().clear();
  });

  it('getOrSet stores factory result and coalesces concurrent loads', async () => {
    const kv = new MemoryKvCacheService();
    let loads = 0;
    const factory = async () => {
      loads += 1;
      await new Promise((r) => setTimeout(r, 20));
      return { n: loads };
    };

    const [a, b] = await Promise.all([
      kv.getOrSet('pam:test:getOrSet', factory, { ttlMs: 5_000 }),
      kv.getOrSet('pam:test:getOrSet', factory, { ttlMs: 5_000 })
    ]);

    expect(a).toEqual({ n: 1 });
    expect(b).toEqual({ n: 1 });
    expect(loads).toBe(1);
    expect(await kv.getItem('pam:test:getOrSet')).toEqual({ n: 1 });
  });

  it('removeByPrefix only deletes matching keys', async () => {
    const kv = new MemoryKvCacheService();
    await kv.setItem('pam:roles:idKeyMaps', { ok: 1 }, { ttlMs: 5_000 });
    await kv.setItem('pam:categories:v1', ['a'], { ttlMs: 5_000 });

    expect(await kv.removeByPrefix('pam:roles:')).toBe(1);
    expect(await kv.getItem('pam:roles:idKeyMaps')).toBeNull();
    expect(await kv.getItem<string[]>('pam:categories:v1')).toEqual(['a']);
  });
});
