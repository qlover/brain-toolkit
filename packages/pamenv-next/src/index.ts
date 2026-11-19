import { readFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ensurePamenvRuntimeEnv,
  injectPamenvProcessEnv,
  PamenvBag,
  resolvePamenvEnabled,
  type EnvSourceInterface,
  type PamenvBagInterface,
  type PamenvInjectOptions,
  type PamenvRuntimeOptions
} from 'pamenv-cli';
import type { PamCiOidcProviderType } from 'pamenv-cli';

/**
 * CJS 自带 `__dirname`。ESM 产物由 tsup banner 补上，指向当前入口文件所在目录。
 */
declare const __dirname: string;

/**
 * 与打包后的入口同目录。
 * 构建期插件把密封快照复制到这里，运行时用这条静态路径去读。
 * NFT / Turbopack 跟得上 `readFile` 的静态路径，proxy 的清单也会带上这个文件。
 */
const PACKAGED_SNAPSHOT_PATH = path.join(__dirname, 'deploy-snapshot.json');

/**
 * 副本在不在。读一次是为了让追踪器看见这个静态路径。
 */
async function probePackagedSnapshot(): Promise<boolean> {
  try {
    await readFile(PACKAGED_SNAPSHOT_PATH);
    return true;
  } catch {
    return false;
  }
}

export type {
  EnvSourceInterface,
  PamenvBagInterface,
  PamenvInjectOptions,
  PamenvRuntimeOptions
};
export { PamenvBag };

/**
 * `@pamenv/next` 约定的部署快照路径（相对项目 cwd）。
 * 插件 build 写入、`createPamenv` 读取，应用层不必传。
 * monorepo 须由应用传入 `cwd`（如 next.config 的 `__dirname`），库不猜测应用目录名。
 */
export function resolvePamenvNextSnapshotPath(cwd?: string): string {
  // 固定落在 `.pam/`，避免 Turbopack 把 process.cwd() 判成整仓 NFT。
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
 * 调用方指定的路径优先。
 * Vercel 上包目录旁的副本存在时用它：Turbopack 能把这条静态路径打进 proxy。
 * 否则回落 `PAMENV_SNAPSHOT_PATH` 或项目 `.pam/deploy-snapshot.json`。
 */
function resolveRuntimeSnapshotPath(
  cwd: string,
  preferred: string | undefined,
  packagedReady: boolean
): string {
  const explicit = preferred?.trim();
  if (explicit) {
    return path.isAbsolute(explicit) ? explicit : path.resolve(cwd, explicit);
  }
  if (process.env.VERCEL === '1' && packagedReady) {
    return PACKAGED_SNAPSHOT_PATH;
  }
  const raw =
    process.env.PAMENV_SNAPSHOT_PATH?.trim() ||
    resolvePamenvNextSnapshotPath(cwd);
  return path.isAbsolute(raw) ? raw : path.resolve(cwd, raw);
}

export type PamenvNextConfigContext = {
  readonly defaultConfig: unknown;
};

/**
 * `@pamenv/next` 插件选项。
 *
 * ### 推荐
 * ```ts
 * createPamenvPlugin({ slug: 'pam', env: 'local', oidc: 'vercel', debug: true })
 * ```
 * - 有 `oidc`：对应 CI 的 production build 自动 OIDC 注入；本地 `next dev` 走 `.pam`
 * - `debug`：可传 `true`；省略则读 `PAMENV_DEBUG`
 *
 * ### `enabled`（总开关）
 * 仅表示程序上是否启用 pamenv 注入能力：
 * - 不传 / `true`：允许注入；具体何时注入看下方「自动时机」
 * - `false`：整插件不注入（不请求 PAM）
 * - 环境变量 `PAMENV_ENABLED=0|false|off|no`：**强制关闭**插件注入与
 *   `createPamenv` 解封（返回空袋，改走进程/平台环境变量）
 *
 * ### 自动时机（插件内部）
 * - 本地：`phase-development-server`（`next dev`）
 * - 匹配的 CI（如 `VERCEL=1`）：`phase-production-build` /
 *   `phase-production-server` / `phase-export`
 *
 * ### 可选开关
 * - `dev`：本地 development-server 是否参与自动时机（默认 true）
 * - `ci`：匹配 CI 的 build 是否参与自动时机（默认：有 `oidc` 时 true）
 * - `inlineEnv`：inject 后把**指定键**合并进 `nextConfig.env`（Edge 静态内联用；
 *   可能进前端包，只放如 `SESSION_SECRET` 等必要键）
 */
export type PamenvNextPluginOptions = Omit<PamenvInjectOptions, 'enabled'> & {
  /**
   * 是否启用 pamenv 注入能力（总开关）。
   * `false` 时永不注入；省略或 `true` 时由自动时机决定。
   */
  readonly enabled?: boolean;
  /** 本地 `next dev` 是否参与自动注入。默认 true。 */
  readonly dev?: boolean;
  /**
   * 匹配 CI 的 production build 是否参与自动注入。
   * 默认：传了 `oidc` 时为 true，否则 false。
   */
  readonly ci?: boolean;
  /**
   * 注入后写入 `nextConfig.env` 的键名（值取自当时 `process.env`）。
   * 供 Edge middleware 等无法解密封、又必须构建期内联的少量变量。
   */
  readonly inlineEnv?: readonly string[];
};

const PRODUCTION_PHASES = new Set([
  'phase-production-build',
  'phase-production-server',
  'phase-export'
]);

/**
 * 返回 Next config 包装器（形态同 `createNextIntlPlugin`）。
 * Next 调用时先写入 `process.env`，再执行内层 config。
 *
 * @example
 * const withPamenv = createPamenvPlugin({
 *   slug: 'pam',
 *   env: process.env.PAM_ENV,
 *   oidc: 'vercel',
 *   debug: true,
 *   enabled: true
 * });
 *
 * @param options - inject 字段 + 可选 `dev` / `ci` / `enabled`
 */
export function createPamenvPlugin(options: PamenvNextPluginOptions) {
  return function withPamenv<TConfig>(
    config:
      | TConfig
      | ((
          phase: string,
          context: PamenvNextConfigContext
        ) => TConfig | Promise<TConfig>)
  ): (phase: string, context: PamenvNextConfigContext) => Promise<TConfig> {
    return async (phase, context) => {
      const {
        dev: _dev,
        ci: _ci,
        inlineEnv,
        ...injectOptions
      } = options;
      const cwd =
        injectOptions.cwd ?? /* turbopackIgnore: true */ process.cwd();
      const onCiBuild =
        phase === 'phase-production-build' && isMatchingCi(options.oidc);
      const snapshotPath = onCiBuild
        ? (injectOptions.snapshotPath ?? resolvePamenvNextSnapshotPath(cwd))
        : undefined;
      await injectPamenvProcessEnv({
        ...injectOptions,
        enabled: shouldInject(options, phase),
        snapshotPath
      });
      if (snapshotPath) {
        await copySnapshotBesidePackage(snapshotPath);
      }
      let resolved: TConfig;
      if (typeof config === 'function') {
        resolved = await (
          config as (
            phase: string,
            context: PamenvNextConfigContext
          ) => TConfig | Promise<TConfig>
        )(phase, context);
      } else {
        resolved = config;
      }
      return mergeSnapshotTraceInclude(
        mergeInlineEnvIntoNextConfig(resolved, inlineEnv)
      );
    };
  };
}

/**
 * 把 `inlineEnv` 指定键从当前 `process.env` 合并进 Next config 的 `env`。
 */
function mergeInlineEnvIntoNextConfig<TConfig>(
  config: TConfig,
  inlineEnv: readonly string[] | undefined
): TConfig {
  if (!inlineEnv?.length) {
    return config;
  }

  const picked: Record<string, string> = {};
  for (const key of inlineEnv) {
    const name = key.trim();
    if (!name) {
      continue;
    }
    const value = process.env[name];
    if (typeof value === 'string') {
      picked[name] = value;
    }
  }

  if (Object.keys(picked).length === 0) {
    return config;
  }

  const record = config as Record<string, unknown>;
  const existing =
    record.env !== null &&
    typeof record.env === 'object' &&
    !Array.isArray(record.env)
      ? (record.env as Record<string, string | undefined>)
      : {};

  return {
    ...record,
    env: {
      ...existing,
      ...picked
    }
  } as TConfig;
}

const SNAPSHOT_TRACE_INCLUDE = './.pam/deploy-snapshot.json';

/**
 * 构建期快照是 gitignore 的，NFT 默认不跟。
 * 页面路由靠这条 include；proxy 还要靠包目录旁的静态副本。
 */
function mergeSnapshotTraceInclude<TConfig>(config: TConfig): TConfig {
  const record = config as Record<string, unknown>;
  const existing =
    record.outputFileTracingIncludes !== null &&
    typeof record.outputFileTracingIncludes === 'object' &&
    !Array.isArray(record.outputFileTracingIncludes)
      ? (record.outputFileTracingIncludes as Record<string, readonly string[]>)
      : {};
  const current = existing['/**/*'] ?? [];
  if (current.includes(SNAPSHOT_TRACE_INCLUDE)) {
    return config;
  }
  return {
    ...record,
    outputFileTracingIncludes: {
      ...existing,
      '/**/*': [...current, SNAPSHOT_TRACE_INCLUDE]
    }
  } as TConfig;
}

/**
 * 把项目里的密封快照复制到包入口旁边。
 * 文件不存在时跳过（注入被关掉，或这次构建没有写出快照）。
 */
async function copySnapshotBesidePackage(snapshotPath: string): Promise<void> {
  if (path.resolve(snapshotPath) === path.resolve(PACKAGED_SNAPSHOT_PATH)) {
    return;
  }
  try {
    await copyFile(snapshotPath, PACKAGED_SNAPSHOT_PATH);
  } catch (error) {
    const code =
      error !== null && typeof error === 'object' && 'code' in error
        ? error.code
        : undefined;
    if (code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

/**
 * 运行时解封部署快照 → 返回 {@link PamenvBagInterface}。
 *
 * ```ts
 * import { createPamenv } from '@pamenv/next';
 * const bag = await createPamenv();
 * const session = await createPamenv({ only: ['SESSION_SECRET'] });
 * // 默认不写 process.env；遗留裸读时：
 * await createPamenv({ writeProcessEnv: true });
 * ```
 *
 * - Edge：库内 no-op，返回空 bag（应用层不必判断 `NEXT_RUNTIME`）
 * - `writeProcessEnv` 默认 **`false`**：以 bag 为主
 * - `only` / `omit` / `keepEnv` / `cache`：与 pamenv-cli 同源
 */
export async function createPamenv(
  options: PamenvRuntimeOptions = {}
): Promise<PamenvBagInterface> {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return new PamenvBag({});
  }

  const cwd = options.cwd ?? /* turbopackIgnore: true */ process.cwd();
  const packagedReady = await probePackagedSnapshot();
  return ensurePamenvRuntimeEnv({
    oidc: 'vercel',
    preferLocal: false,
    ...options,
    cwd,
    snapshotPath: resolveRuntimeSnapshotPath(
      cwd,
      options.snapshotPath,
      packagedReady
    )
  });
}

/**
 * @deprecated 请用 {@link createPamenv}；保留别名以免旧调用立刻断裂。
 */
export async function ensurePamenvRuntime(
  options: PamenvRuntimeOptions = {}
): Promise<PamenvBagInterface> {
  return createPamenv(options);
}

/**
 * @deprecated 同 {@link createPamenv}。
 */
export const registerPamenvRuntime: (
  options?: PamenvRuntimeOptions
) => Promise<PamenvBagInterface> = createPamenv;

/**
 * 是否执行注入：总开关开启 ∧ 自动时机匹配。
 */
function shouldInject(
  options: PamenvNextPluginOptions,
  phase: string
): boolean {
  if (!resolvePamenvEnabled(options.enabled)) {
    return false;
  }

  return resolveAutoTiming(options, phase);
}

/**
 * 按 Next phase + 是否在匹配 CI 决定「这个时机」是否注入。
 */
function resolveAutoTiming(
  options: PamenvNextPluginOptions,
  phase: string
): boolean {
  const injectDev = options.dev !== false;
  const injectCi = options.ci ?? options.oidc !== undefined;
  const onMatchingCi = isMatchingCi(options.oidc);

  if (onMatchingCi) {
    return injectCi && PRODUCTION_PHASES.has(phase);
  }

  return injectDev && phase === 'phase-development-server';
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
