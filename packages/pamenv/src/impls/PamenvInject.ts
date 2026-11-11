import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { PamCliConfig } from '../config/PamCliConfig';
import { PamCliI18n } from '../i18n/PamCliI18n';
import {
  assertOnlyOmitExclusive,
  normalizePamCliKeyList,
  RunCommand,
  type PamCliRunOptionsType
} from '../commands/RunCommand';
import type { PamCiOidcProviderType } from '../interfaces/PamCiOidcTokenSourceInterface';
import type {
  PamenvDeploySnapshotFileType,
  PamenvDeploySnapshotV1FileType,
  PamenvDeploySnapshotV2FileType
} from '../interfaces/PamenvDeploySnapshotEngineInterface';
import { PamCiOidcBootstrap } from './PamCiOidcBootstrap';
import { PamCliApiClient } from './PamCliApiClient';
import { PamCliAuthStore } from './PamCliAuthStore';
import {
  PAMENV_DEPLOY_SNAPSHOT_ALG,
  PAMENV_DEPLOY_SNAPSHOT_ALG_V1,
  PamenvDeploySnapshotEngine
} from './PamenvDeploySnapshotEngine';
import { PamenvBag } from './PamenvBag';
import type { PamenvBagInterface } from '../interfaces/PamenvBagInterface';

/**
 * 把 PAM 环境写入当前进程 `process.env`（语义同 `pamenv run <slug> -e <env>`）。
 *
 * ### slug / env
 * - `PAMENV_PROJECT_SLUG` / `PAMENV_ENV_NAME` / `PAM_ENV` **优先于**入参；
 * - 未设环境变量时用入参；二者都缺则抛错。
 *
 * ### oidc
 * 直接传 `'vercel' | 'github'`。仅在对应 CI 生效（`VERCEL=1` /
 * `GITHUB_ACTIONS`）；本地忽略，仍走 `.pam`。
 *
 * ### only / omit / keepEnv / cache
 * 与 CLI 同源：`only` 白名单、`omit` 黑名单（互斥）、`keepEnv` 保留已有、
 * `cache` 默认 true。
 *
 * ### snapshotPath
 * CI 注入成功后写入密封部署快照（无明文）；运行时 `ensurePamenvRuntimeEnv` 解封。
 */
export type PamenvInjectOptions = PamCliRunOptionsType & {
  readonly slug?: string;
  readonly env?: string;
  /**
   * 是否启用注入能力。`false` 时不请求 PAM、不写环境；
   * 省略或 `true` 表示允许注入（具体时机由 Next/Vite 插件自行判断）。
   */
  readonly enabled?: boolean;
  readonly cwd?: string;
  readonly preferLocal?: boolean;
  /**
   * 部署快照输出路径。仅在匹配 CI 且本次注入成功时写入。
   */
  readonly snapshotPath?: string;
};

/**
 * 运行时选项：优先解封 `snapshotPath`；无快照时在 Vercel 上 fail-closed。
 *
 * ### writeProcessEnv
 * 默认 **`false`**：只返回 {@link PamenvBagInterface}，不污染全局。
 * 遗留裸读 `process.env` 时显式传 `true`。
 */
export type PamenvRuntimeOptions = Omit<PamenvInjectOptions, 'enabled'> & {
  readonly enabled?: boolean;
  /**
   * 是否把解封结果写入 `process.env`。默认 `false`。
   */
  readonly writeProcessEnv?: boolean;
};

type PamenvResolvedInjectOptionsType = PamenvInjectOptions & {
  readonly slug: string;
  readonly env: string;
  readonly oidc?: PamCiOidcProviderType;
  readonly preferLocal: boolean;
  readonly onlyKeys: readonly string[];
  readonly omitKeys: readonly string[];
  readonly keepEnvKeys: readonly string[];
};

type PamenvInjectRunResultType = {
  readonly expiresAtMs: number;
  readonly values: Readonly<Record<string, string>>;
};

type PamenvInjectCacheEntryType = {
  readonly promise: Promise<PamenvInjectRunResultType>;
  expiresAtMs: number;
  values: Readonly<Record<string, string>>;
};

const OIDC_REFRESH_SKEW_MS = 60_000;

const injected = new Map<string, PamenvInjectCacheEntryType>();

/**
 * 将 resolve 后的变量写入 `process.env`；可选写出密封部署快照。
 */
export async function injectPamenvProcessEnv(
  options: PamenvInjectOptions
): Promise<void> {
  if (options.enabled === false) {
    return;
  }

  const resolved = resolvePamenvInjectOptions(options);
  const cwd = resolved.cwd ?? process.cwd();
  await runWithInjectCache(
    buildInjectCacheKey(resolved, cwd),
    options.cache !== false,
    () => applyPamenvProcessEnv(resolved, cwd)
  );
}

const DEFAULT_RUNTIME_KEEP_ENV = [
  'PAM_ENV',
  'APP_ENV',
  'VERCEL',
  'VERCEL_ENV',
  'NODE_ENV',
  'NEXT_RUNTIME'
] as const;

/**
 * CI 运行时：优先解封部署快照（与 build 同源）；无快照则 Vercel fail-closed。
 *
 * 解封路径**不要求** slug/env：`projectRef` 以快照字段为准。
 * v2 按键密封：`only`/`omit` 控制真正 AES 的键；不传则整表解密。
 *
 * 默认**不**写 `process.env`，返回 {@link PamenvBagInterface}；
 * 需要全局可见时传 `writeProcessEnv: true`。
 */
export async function ensurePamenvRuntimeEnv(
  options: PamenvRuntimeOptions = {}
): Promise<PamenvBagInterface> {
  const oidc = resolveActiveOidcProvider(options.oidc ?? 'vercel');
  const enabled =
    options.enabled ?? (oidc !== undefined || process.env.VERCEL === '1');
  if (!enabled) {
    return new PamenvBag({});
  }

  const snapshotPath =
    options.snapshotPath?.trim() ||
    process.env.PAMENV_SNAPSHOT_PATH?.trim() ||
    '';

  if (snapshotPath) {
    const resolved = resolvePamenvSnapshotRuntimeOptions(options);
    const cwd = resolved.cwd ?? process.cwd();
    const key = `snapshot\0${snapshotPath}\0${buildInjectCacheKey(resolved, cwd)}`;
    const values = await runWithInjectCache(
      key,
      options.cache !== false,
      () => openDeploySnapshot(resolved, snapshotPath)
    );
    const bag = new PamenvBag(values);
    if (options.writeProcessEnv === true) {
      bag.applyToProcessEnv({ keepEnv: resolved.keepEnvKeys });
    }
    return bag;
  }

  if (process.env.VERCEL === '1') {
    throw new Error(
      'pamenv: deploy snapshot missing on Vercel (set snapshotPath / PAMENV_SNAPSHOT_PATH and rebuild)'
    );
  }

  return new PamenvBag({});
}

/**
 * 运行时解封用：slug/env 可缺（缓存键占位）；OIDC / keepEnv 仍解析。
 */
function resolvePamenvSnapshotRuntimeOptions(
  options: PamenvRuntimeOptions
): PamenvResolvedInjectOptionsType {
  const slug =
    process.env[PamCliConfig.ENV_PROJECT_SLUG]?.trim() ||
    options.slug?.trim() ||
    '';
  const env =
    process.env[PamCliConfig.ENV_ENV_NAME]?.trim() ||
    options.env?.trim() ||
    '';
  const onlyKeys = normalizePamCliKeyList(options.only);
  const omitKeys = normalizePamCliKeyList(options.omit);
  assertOnlyOmitExclusive(onlyKeys, omitKeys);
  const keepEnvKeys = normalizePamCliKeyList(
    options.keepEnv ?? [...DEFAULT_RUNTIME_KEEP_ENV]
  );

  return {
    ...options,
    slug: slug || '_snapshot_',
    env: env || '_snapshot_',
    oidc: options.oidc ?? 'vercel',
    preferLocal: false,
    only: onlyKeys,
    omit: omitKeys,
    keepEnv: keepEnvKeys,
    onlyKeys,
    omitKeys,
    keepEnvKeys
  };
}

/** 测试用：清空进程内注入缓存。 */
export function resetPamenvInjectCache(): void {
  injected.clear();
}

/**
 * 解析 slug / env / 生效中的 oidc / preferLocal / 键名单。
 */
export function resolvePamenvInjectOptions(
  options: PamenvInjectOptions
): PamenvResolvedInjectOptionsType {
  const slug =
    process.env[PamCliConfig.ENV_PROJECT_SLUG]?.trim() ||
    options.slug?.trim() ||
    '';
  const env =
    process.env[PamCliConfig.ENV_ENV_NAME]?.trim() ||
    process.env[PamCliConfig.ENV_PAM_ENV]?.trim() ||
    options.env?.trim() ||
    '';
  if (!slug) {
    throw new Error(
      `pamenv inject requires slug or ${PamCliConfig.ENV_PROJECT_SLUG}`
    );
  }
  if (!env) {
    throw new Error(
      `pamenv inject requires env or ${PamCliConfig.ENV_ENV_NAME} / ${PamCliConfig.ENV_PAM_ENV}`
    );
  }

  const oidc = resolveActiveOidcProvider(options.oidc);
  const preferLocal =
    options.preferLocal !== undefined
      ? options.preferLocal
      : oidc === undefined;
  const onlyKeys = normalizePamCliKeyList(options.only);
  const omitKeys = normalizePamCliKeyList(options.omit);
  assertOnlyOmitExclusive(onlyKeys, omitKeys);
  const keepEnvKeys = normalizePamCliKeyList(options.keepEnv);

  return {
    ...options,
    slug,
    env,
    oidc,
    preferLocal,
    only: onlyKeys,
    omit: omitKeys,
    keepEnv: keepEnvKeys,
    onlyKeys,
    omitKeys,
    keepEnvKeys
  };
}

/**
 * 仅在匹配的 CI 中返回 provider；本地返回 undefined。
 */
export function resolveActiveOidcProvider(
  oidc: PamCiOidcProviderType | undefined
): PamCiOidcProviderType | undefined {
  if (oidc === 'vercel' && process.env.VERCEL === '1') {
    return 'vercel';
  }
  if (
    oidc === 'github' &&
    (process.env.GITHUB_ACTIONS === 'true' ||
      process.env.GITHUB_ACTIONS === '1')
  ) {
    return 'github';
  }
  return undefined;
}

async function runWithInjectCache(
  key: string,
  useCache: boolean,
  run: () => Promise<PamenvInjectRunResultType>
): Promise<Readonly<Record<string, string>>> {
  if (useCache) {
    const existing = injected.get(key);
    if (existing && isInjectCacheFresh(existing)) {
      await existing.promise;
      return existing.values;
    }
    if (existing) {
      injected.delete(key);
    }
  } else {
    injected.delete(key);
  }

  let expiresAtMs = Number.POSITIVE_INFINITY;
  let values: Readonly<Record<string, string>> = Object.freeze({});
  const task = run()
    .then((result) => {
      expiresAtMs = result.expiresAtMs;
      values = result.values;
      const entry = injected.get(key);
      if (entry && entry.promise === task) {
        entry.expiresAtMs = expiresAtMs;
        entry.values = values;
      }
      return result;
    })
    .catch((error: unknown) => {
      injected.delete(key);
      throw error;
    });

  if (useCache) {
    injected.set(key, { promise: task, expiresAtMs, values });
  }
  await task;
  return values;
}

function buildInjectCacheKey(
  options: PamenvResolvedInjectOptionsType,
  cwd: string
): string {
  return [
    cwd,
    options.slug,
    options.env,
    options.preferLocal === false ? 'global' : 'local',
    options.envPriority === 'local' ? 'env-local' : 'env-remote',
    options.oidc ?? 'no-oidc',
    options.onlyKeys.join(','),
    options.omitKeys.join(','),
    options.keepEnvKeys.join(','),
    options.snapshotPath ?? '',
    options.clientPublicPrefixes === undefined
      ? 'prefixes-default'
      : `prefixes:${options.clientPublicPrefixes.join(',')}`
  ].join('\0');
}

function isInjectCacheFresh(entry: PamenvInjectCacheEntryType): boolean {
  if (!Number.isFinite(entry.expiresAtMs)) {
    return true;
  }
  return Date.now() < entry.expiresAtMs - OIDC_REFRESH_SKEW_MS;
}

/**
 * @param debug - 入参；`undefined` 时读 `PAMENV_DEBUG`
 */
export function resolveInjectDebug(debug: boolean | undefined): boolean {
  if (debug === true || debug === false) {
    return debug;
  }
  const raw = process.env[PamCliConfig.ENV_DEBUG]?.trim().toLowerCase();
  return raw === '1' || raw === 'true';
}

async function applyPamenvProcessEnv(
  options: PamenvResolvedInjectOptionsType,
  cwd: string
): Promise<PamenvInjectRunResultType> {
  const preferLocal = options.preferLocal;
  const authWorkingDir = preferLocal
    ? (PamCliConfig.resolveLocalWorkingDir(cwd) ?? cwd)
    : cwd;
  const authStore = new PamCliAuthStore({
    preferLocal,
    workingDir: authWorkingDir
  });
  await PamCliI18n.syncFromStore(authStore);
  await PamCliI18n.ensureLoaded(PamCliI18n.getLocale());
  await PamCliI18n.ensureLoaded('en');

  const apiClient = new PamCliApiClient(authStore);
  const command = new RunCommand(apiClient, authStore);
  const prepared = await command.prepare(
    options.slug,
    {
      envName: options.env,
      only: options.onlyKeys,
      omit: options.omitKeys,
      keepEnv: options.keepEnvKeys,
      warn: options.warn,
      envPriority: options.envPriority,
      clientPublicPrefixes: options.clientPublicPrefixes,
      oidc: options.oidc,
      debug: resolveInjectDebug(options.debug)
    },
    cwd
  );

  for (const [name, value] of Object.entries(prepared.env)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  if (options.snapshotPath?.trim() && options.oidc !== undefined) {
    const pamVariables: Record<string, string> = {};
    for (const variable of prepared.variables) {
      pamVariables[variable.key] = variable.value;
    }
    await writeDeploySnapshotFile({
      snapshotPath: options.snapshotPath.trim(),
      projectRef: options.slug,
      envName: options.env,
      envMap: pamVariables,
      apiClient,
      debug: resolveInjectDebug(options.debug)
    });
  }

  const expiresAtMs = prepared.oidcExpiresAt
    ? Date.parse(prepared.oidcExpiresAt)
    : Number.POSITIVE_INFINITY;

  return {
    expiresAtMs: Number.isFinite(expiresAtMs)
      ? expiresAtMs
      : Number.POSITIVE_INFINITY,
    values: Object.freeze({})
  };
}

/**
 * 解封部署快照 → 明文表（不写 `process.env`）。
 */
async function openDeploySnapshot(
  options: PamenvResolvedInjectOptionsType,
  snapshotPath: string
): Promise<PamenvInjectRunResultType> {
  const raw = await readFile(snapshotPath, 'utf8');
  const snapshot = JSON.parse(raw) as PamenvDeploySnapshotFileType;

  const preferLocal = false;
  const cwd = options.cwd ?? process.cwd();
  const authStore = new PamCliAuthStore({
    preferLocal,
    workingDir: cwd
  });
  await PamCliI18n.syncFromStore(authStore);
  await PamCliI18n.ensureLoaded(PamCliI18n.getLocale());
  await PamCliI18n.ensureLoaded('en');

  const apiClient = new PamCliApiClient(authStore);
  const debug = resolveInjectDebug(options.debug);
  const provider = options.oidc ?? 'vercel';
  const issued = await new PamCiOidcBootstrap(
    apiClient,
    authStore
  ).ensurePamenvToken(provider, debug);

  const projectRef = snapshot.projectRef || options.slug;
  const dekBase64 = await apiClient.unwrapDeployDek(
    projectRef,
    snapshot.wrappedDek
  );
  const engine = new PamenvDeploySnapshotEngine();
  const variables = openSnapshotVariables(engine, snapshot, dekBase64, options);
  assertOnlyKeysPresent(options.onlyKeys, variables);

  const expiresAtMs = issued.expiresAt
    ? Date.parse(issued.expiresAt)
    : Number.POSITIVE_INFINITY;

  return {
    expiresAtMs: Number.isFinite(expiresAtMs)
      ? expiresAtMs
      : Number.POSITIVE_INFINITY,
    values: Object.freeze({ ...variables })
  };
}

/**
 * v2：按 only/omit 只 AES 选中键；v1：整包 open 后再过滤（降级）。
 */
function openSnapshotVariables(
  engine: PamenvDeploySnapshotEngine,
  snapshot: PamenvDeploySnapshotFileType,
  dekBase64: string,
  options: PamenvResolvedInjectOptionsType
): Record<string, string> {
  if (isDeploySnapshotV2(snapshot)) {
    const keys = resolveSnapshotKeysToOpen(
      Object.keys(snapshot.entries),
      options.onlyKeys,
      options.omitKeys
    );
    return engine.openKeys(snapshot, dekBase64, keys);
  }

  if (isDeploySnapshotV1(snapshot)) {
    if (resolveInjectDebug(options.debug)) {
      process.stderr.write(
        '[pamenv] deploy snapshot v1 detected; opening full blob then filtering (rebuild for per-key v2)\n'
      );
    }
    const all = engine.openV1(snapshot, dekBase64);
    const keys = resolveSnapshotKeysToOpen(
      Object.keys(all),
      options.onlyKeys,
      options.omitKeys
    );
    const keySet = new Set(keys);
    const filtered: Record<string, string> = {};
    for (const [name, value] of Object.entries(all)) {
      if (keySet.has(name)) {
        filtered[name] = value;
      }
    }
    return filtered;
  }

  throw new Error('pamenv: unsupported deploy snapshot format');
}

function isDeploySnapshotV2(
  snapshot: PamenvDeploySnapshotFileType
): snapshot is PamenvDeploySnapshotV2FileType {
  return (
    snapshot.v === 2 &&
    snapshot.alg === PAMENV_DEPLOY_SNAPSHOT_ALG &&
    snapshot.entries !== undefined &&
    typeof snapshot.entries === 'object'
  );
}

function isDeploySnapshotV1(
  snapshot: PamenvDeploySnapshotFileType
): snapshot is PamenvDeploySnapshotV1FileType {
  return (
    snapshot.v === 1 &&
    snapshot.alg === PAMENV_DEPLOY_SNAPSHOT_ALG_V1 &&
    typeof snapshot.nonce === 'string' &&
    typeof snapshot.ciphertext === 'string'
  );
}

/**
 * 决定要解密/写入的键：only > omit > 全量。
 */
export function resolveSnapshotKeysToOpen(
  availableKeys: readonly string[],
  onlyKeys: readonly string[],
  omitKeys: readonly string[]
): string[] {
  assertOnlyOmitExclusive(onlyKeys, omitKeys);
  if (onlyKeys.length > 0) {
    return [...onlyKeys];
  }
  if (omitKeys.length > 0) {
    const omit = new Set(omitKeys);
    return availableKeys.filter((key) => !omit.has(key));
  }
  return [...availableKeys];
}

/**
 * `only` 指定的键必须能从快照解开，或进程里已有非空值（平台/keepEnv）。
 * 缺键直接抛错，避免静默落回应用层测试默认值。
 */
export function assertOnlyKeysPresent(
  onlyKeys: readonly string[],
  opened: Readonly<Record<string, string>>
): void {
  if (onlyKeys.length === 0) {
    return;
  }
  const missing: string[] = [];
  for (const key of onlyKeys) {
    const fromSnap = opened[key];
    if (typeof fromSnap === 'string' && fromSnap.length > 0) {
      continue;
    }
    const existing = process.env[key];
    if (typeof existing === 'string' && existing.trim() !== '') {
      continue;
    }
    missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(
      `pamenv: deploy snapshot missing required keys: ${missing.join(', ')}`
    );
  }
}

async function writeDeploySnapshotFile(params: {
  readonly snapshotPath: string;
  readonly projectRef: string;
  readonly envName: string;
  readonly envMap: NodeJS.ProcessEnv;
  readonly apiClient: PamCliApiClient;
  readonly debug: boolean;
}): Promise<void> {
  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(params.envMap)) {
    if (typeof value === 'string') {
      variables[key] = value;
    }
  }

  const engine = new PamenvDeploySnapshotEngine();
  const created = engine.createFromVariables(variables);
  const wrappedDek = await params.apiClient.wrapDeployDek(
    params.projectRef,
    created.dekBase64
  );

  const file: PamenvDeploySnapshotV2FileType = {
    v: 2,
    alg: PAMENV_DEPLOY_SNAPSHOT_ALG,
    projectRef: params.projectRef,
    envName: params.envName,
    createdAt: new Date().toISOString(),
    entries: created.entries,
    wrappedDek
  };

  await mkdir(dirname(params.snapshotPath), { recursive: true });
  await writeFile(params.snapshotPath, `${JSON.stringify(file)}\n`, 'utf8');

  if (params.debug) {
    process.stderr.write(
      `[pamenv] wrote deploy snapshot v2 (${Object.keys(variables).length} keys) → ${params.snapshotPath}\n`
    );
  }
}
