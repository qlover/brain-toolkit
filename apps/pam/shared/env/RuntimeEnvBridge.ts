import { ProcessEnvSource } from './ProcessEnvSource';
import type { EnvSourceInterface } from '@pamenv/next';

/**
 * 进程内当前生效的环境源桥。
 *
 * ### 为何存在
 * 部分基础设施（如 `shared/supabase/server`）尚不能注入 `ServerConfig`，
 * 又不能在 `writeProcessEnv: false` 时继续裸读空的 `process.env`。
 * 入口 {@link ServerConfig.bindPamenvBag} 会把组合源挂到这里；
 * 遗留模块经 {@link getRuntimeEnv} 读取，与 config 同源。
 */
class RuntimeEnvBridge implements EnvSourceInterface {
  protected source: EnvSourceInterface = ProcessEnvSource.INSTANCE;

  /**
   * 替换当前源（通常为 bag + process 的组合源）。
   */
  public bind(source: EnvSourceInterface): void {
    this.source = source;
  }

  /**
   * @override
   */
  public get(key: string): string | undefined {
    return this.source.get(key);
  }

  /**
   * @override
   */
  public has(key: string): boolean {
    return this.source.has(key);
  }
}

/** 单例桥：与一次请求内的 `ServerConfig` 同步。 */
export const runtimeEnvBridge: RuntimeEnvBridge = new RuntimeEnvBridge();

/**
 * 遗留模块读环境键的统一入口（等同 `runtimeEnvBridge.get`）。
 */
export function getRuntimeEnv(key: string): string | undefined {
  return runtimeEnvBridge.get(key);
}
