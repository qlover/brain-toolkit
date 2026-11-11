import type { EnvSourceInterface } from '@pamenv/next';

/**
 * `process.env` 适配器：平台键与本地进程级注入的回落源。
 */
export class ProcessEnvSource implements EnvSourceInterface {
  public static readonly INSTANCE: ProcessEnvSource = new ProcessEnvSource();

  /**
   * @override
   */
  public get(key: string): string | undefined {
    return process.env[key];
  }

  /**
   * @override
   */
  public has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(process.env, key);
  }
}
