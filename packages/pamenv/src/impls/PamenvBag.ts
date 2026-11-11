import type { PamenvBagInterface } from '../interfaces/PamenvBagInterface';

/**
 * {@link PamenvBagInterface} 的默认实现：冻结表 + 可选投影到 `process.env`。
 */
export class PamenvBag implements PamenvBagInterface {
  public readonly values: Readonly<Record<string, string>>;

  /**
   * @param values - 解封得到的明文表；构造时浅拷贝并冻结
   */
  public constructor(values: Readonly<Record<string, string>>) {
    this.values = Object.freeze({ ...values });
  }

  /**
   * @override
   */
  public get(key: string): string | undefined {
    return this.values[key];
  }

  /**
   * @override
   */
  public has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.values, key);
  }

  /**
   * @override
   */
  public applyToProcessEnv(options?: {
    readonly keepEnv?: readonly string[];
  }): void {
    const keep = new Set(options?.keepEnv ?? []);
    for (const [name, value] of Object.entries(this.values)) {
      if (keep.has(name) && process.env[name] !== undefined) {
        continue;
      }
      process.env[name] = value;
    }
  }
}
