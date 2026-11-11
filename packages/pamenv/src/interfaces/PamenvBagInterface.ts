import type { EnvSourceInterface } from './EnvSourceInterface';

/**
 * 运行时解封得到的密封袋。
 *
 * ### 为何存在
 * Vercel 等平台上构建期明文不在函数进程里；解封结果应是一等公民，
 * 而不是默认灌回全局 `process.env`。业务通过 {@link EnvSourceInterface}
 * 读袋；需要兼容遗留裸读时再显式 {@link applyToProcessEnv}。
 *
 * ### 用法
 * ```ts
 * const bag = await ensurePamenvRuntimeEnv({ only: ['SESSION_SECRET'] });
 * bag.get('SESSION_SECRET');
 * bag.applyToProcessEnv(); // 可选
 * ```
 */
export interface PamenvBagInterface extends EnvSourceInterface {
  /**
   * 本次解封得到的键值表（只含解封出的 PAM 键，不含平台键）。
   */
  readonly values: Readonly<Record<string, string>>;

  /**
   * 将 {@link values} 合并进 `process.env`。
   *
   * @param options.keepEnv - 已存在于 process 的键不覆盖；默认空（全覆盖）
   */
  applyToProcessEnv(options?: {
    readonly keepEnv?: readonly string[];
  }): void;
}
