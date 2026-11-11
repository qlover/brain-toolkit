import type { EnvSourceInterface } from '@pamenv/next';

/**
 * 组合环境源：primary 优先，未命中再读 fallback。
 *
 * 典型用法：解封袋 + `ProcessEnvSource`（PAM 键走袋，`PAM_ENV` / `VERCEL` 等平台键回落 process）。
 */
export class CompositeEnvSource implements EnvSourceInterface {
  /**
   * @param primary - 优先源（通常是 {@link PamenvBagInterface}）
   * @param fallback - 回落源（通常是 {@link ProcessEnvSource}）
   */
  public constructor(
    protected readonly primary: EnvSourceInterface,
    protected readonly fallback: EnvSourceInterface
  ) {}

  /**
   * @override
   */
  public get(key: string): string | undefined {
    if (this.primary.has(key)) {
      return this.primary.get(key);
    }
    return this.fallback.get(key);
  }

  /**
   * @override
   */
  public has(key: string): boolean {
    return this.primary.has(key) || this.fallback.has(key);
  }
}
