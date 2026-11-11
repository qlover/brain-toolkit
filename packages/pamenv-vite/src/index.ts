import path from 'node:path';
import {
  injectPamenvProcessEnv,
  resolvePamenvEnabled,
  type PamCiOidcProviderType,
  type PamenvInjectOptions
} from 'pamenv-cli';
import type { ConfigEnv, Plugin } from 'vite';

export type { PamenvInjectOptions };

/**
 * `@pamenv/vite` 插件选项（与 `@pamenv/next` 同构）。
 *
 * ### 推荐
 * ```ts
 * pamenv({ slug: 'my-app', env: 'local', oidc: 'github', debug: true })
 * ```
 * - 有 `oidc`：匹配 CI 的 `vite build` 自动 OIDC 注入；本地 `vite`/`vite dev` 走 `.pam`
 * - `debug`：可传 `true`；省略则读 `PAMENV_DEBUG`
 *
 * ### `enabled`（总开关）
 * - 不传 / `true`：允许注入；具体时机看「自动时机」
 * - `false`：整插件不注入
 * - `PAMENV_ENABLED=0|false|off|no`：强制关闭
 *
 * ### 自动时机
 * - 本地：`command === 'serve'` 且 `dev !== false`
 * - 匹配 CI（`GITHUB_ACTIONS` / `VERCEL=1`）且 `command === 'build'`：
 *   `ci` 默认在传了 `oidc` 时为 true
 */
export type PamenvVitePluginOptions = Omit<PamenvInjectOptions, 'enabled'> & {
  /**
   * 是否启用 pamenv 注入能力（总开关）。
   * `false` 时永不注入；省略或 `true` 时由自动时机决定。
   */
  readonly enabled?: boolean;
  /** 本地 `vite` / `vite dev`（serve）是否参与自动注入。默认 true。 */
  readonly dev?: boolean;
  /**
   * 匹配 CI 的 `vite build` 是否参与自动注入。
   * 默认：传了 `oidc` 时为 true，否则 false。
   */
  readonly ci?: boolean;
};

/**
 * Vite 插件：在早期 `config` 钩子把 PAM 变量写入 `process.env`
 *（多数其它插件与 `loadEnv` 消费者看到之前）。
 *
 * @example
 * import { defineConfig } from 'vite';
 * import pamenv from '@pamenv/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     pamenv({
 *       slug: 'my-app',
 *       env: process.env.PAM_ENV ?? 'local',
 *       oidc: 'github',
 *       debug: process.env.PAMENV_DEBUG === '1'
 *     })
 *   ]
 * });
 *
 * @param options - 与 `pamenv run <slug> -e <env>` 同字段 + `dev` / `ci`
 */
export function createPamenvPlugin(options: PamenvVitePluginOptions): Plugin {
  return {
    name: 'pamenv',
    enforce: 'pre',
    async config(_userConfig, env) {
      if (!shouldInject(options, env)) {
        return;
      }
      const cwd =
        options.cwd ??
        /* turbopackIgnore: true */ process.cwd();
      await injectPamenvProcessEnv({
        ...options,
        cwd,
        enabled: true,
        snapshotPath:
          options.snapshotPath ??
          (isMatchingCi(options.oidc) && env.command === 'build'
            ? resolvePamenvViteSnapshotPath(cwd)
            : undefined)
      });
      return;
    }
  };
}

/** 默认导出 — Vite 惯用插件工厂。 */
export default createPamenvPlugin;

/**
 * `@pamenv/vite` 约定的部署快照路径（相对项目 cwd）。
 * CI build 写出；SPA 运行时通常不需解封。
 */
export function resolvePamenvViteSnapshotPath(cwd?: string): string {
  if (cwd) {
    return path.join(cwd, '.pam', 'deploy-snapshot.json');
  }
  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    '.pam',
    'deploy-snapshot.json'
  );
}

/**
 * 是否执行注入：总开关开启 ∧ 自动时机匹配。
 *
 * @internal 导出供单测
 */
export function shouldInject(
  options: PamenvVitePluginOptions,
  env: Pick<ConfigEnv, 'command'>
): boolean {
  if (!resolvePamenvEnabled(options.enabled)) {
    return false;
  }
  return resolveAutoTiming(options, env.command);
}

/**
 * 按 Vite command + 是否在匹配 CI 决定是否注入。
 *
 * @internal 导出供单测
 */
export function resolveAutoTiming(
  options: PamenvVitePluginOptions,
  command: ConfigEnv['command']
): boolean {
  const injectDev = options.dev !== false;
  const injectCi = options.ci ?? options.oidc !== undefined;
  const onMatchingCi = isMatchingCi(options.oidc);

  if (onMatchingCi) {
    return injectCi && command === 'build';
  }

  return injectDev && command === 'serve';
}

function isMatchingCi(oidc: PamCiOidcProviderType | undefined): boolean {
  if (oidc === 'vercel') {
    return process.env.VERCEL === '1';
  }
  if (oidc === 'github') {
    return (
      process.env.GITHUB_ACTIONS === 'true' ||
      process.env.GITHUB_ACTIONS === '1'
    );
  }
  return (
    process.env.VERCEL === '1' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITHUB_ACTIONS === '1'
  );
}
