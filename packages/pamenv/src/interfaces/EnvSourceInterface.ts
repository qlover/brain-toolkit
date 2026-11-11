/**
 * 只读环境源：配置层只依赖此抽象，不直读 `process.env`。
 *
 * 实现可以是解封袋、`process.env` 适配器，或二者组合（袋优先、平台键回落）。
 */
export interface EnvSourceInterface {
  /**
   * 读取键值；缺失时返回 `undefined`（空字符串视为有值）。
   */
  get(key: string): string | undefined;

  /**
   * 键是否存在（含空字符串）。
   */
  has(key: string): boolean;
}
