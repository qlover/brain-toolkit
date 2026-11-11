import {
  injectPamenvProcessEnv,
  type PamenvInjectOptions
} from 'pamenv-cli';
import type { ConfigEnv, Plugin } from 'vite';

export type { PamenvInjectOptions };

/**
 * Vite 插件选项：`enabled` 可额外按 Vite command 细分（serve / build）。
 */
export type PamenvVitePluginOptions = Omit<PamenvInjectOptions, 'enabled'> & {
  /**
   * 是否启用注入。`false` 关闭；`true` 含 build；
   * 函数接收 Vite `command`（`serve` | `build`）；省略时仅 `serve`。
   */
  readonly enabled?: boolean | ((command: ConfigEnv['command']) => boolean);
};

/**
 * Vite 插件：在早期 `config` 钩子把 PAM 变量写入 `process.env`
 *（多数其它插件与 `loadEnv` 消费者看到之前）。
 *
 * 默认仅 `vite` / `vite:dev`（`command === 'serve'`）注入。
 * `enabled: true` 时 build 也注入；或传函数按 command 判断。
 *
 * @example
 * import { defineConfig } from 'vite';
 * import pamenv from '@pamenv/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     pamenv({
 *       slug: 'my-app',
 *       env: 'local',
 *       debug: process.env.PAMENV_DEBUG === '1'
 *     })
 *   ]
 * });
 *
 * @param options - 与 `pamenv run <slug> -e <env>` 同字段；
 *   `debug` / `envPriority` 默认 false / `remote`
 */
export function createPamenvPlugin(options: PamenvVitePluginOptions): Plugin {
  return {
    name: 'pamenv',
    enforce: 'pre',
    async config(_userConfig, env) {
      await injectPamenvProcessEnv({
        ...options,
        enabled: isEnabled(options, env)
      });
      return;
    }
  };
}

/** 默认导出 — Vite 惯用插件工厂。 */
export default createPamenvPlugin;

function isEnabled(
  options: PamenvVitePluginOptions,
  env: ConfigEnv
): boolean {
  if (typeof options.enabled === 'function') {
    return options.enabled(env.command);
  }
  if (options.enabled === false) {
    return false;
  }
  if (options.enabled === true) {
    return true;
  }
  return env.command === 'serve';
}
