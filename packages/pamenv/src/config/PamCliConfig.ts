import { existsSync, realpathSync, statSync } from 'node:fs';
import { dirname, join, parse, resolve } from 'node:path';

/**
 * Shared config and path constants for pamenv.
 *
 * Significance: Centralizes local CLI state paths and defaults.
 * Core idea: Auth under `~/.pam` by default; a nearest ancestor `.pam`
 * (monorepo root) isolates from home (`--local` / `--global` to force).
 * Local never falls back to global.
 * Main function: Resolve home/local paths and normalize PAM origins.
 * Main purpose: Keep file layout consistent across commands.
 *
 * @example
 * const root = PamCliConfig.getHomeRoot();
 */
export class PamCliConfig {
  public static readonly CONFIG_FILE_NAME = 'config.json' as const;
  public static readonly SYNC_DIR_NAME = 'sync' as const;
  public static readonly PAM_DIR_NAME = '.pam' as const;
  /**
   * Max parent hops when auto-discovering a project `.pam` (cwd itself is
   * hop 0). Caps accidental matches far above the workspace.
   */
  public static readonly MAX_PAM_WALK_UP_DEPTH = 32 as const;
  public static readonly DEFAULT_BASE_URL = 'https://pam.qlover.top' as const;
  public static readonly DEFAULT_LOCALE = 'en' as const;
  public static readonly SUPPORTED_LOCALES = ['en', 'zh'] as const;

  /**
   * CI / runner 内存票环境变量名（不写 vault），优先于 `.pam`。
   */
  public static readonly ENV_TOKEN = 'PAMENV_TOKEN' as const;

  /**
   * 使用 {@link ENV_TOKEN} 且无 config 时可选的 PAM 源站。
   */
  public static readonly ENV_BASE_URL = 'PAMENV_BASE_URL' as const;

  /**
   * OIDC 换票 audience（可选；默认与 {@link ENV_BASE_URL} / config 同源）。
   */
  public static readonly ENV_OIDC_AUD = 'PAM_OIDC_AUD' as const;

  /**
   * 插件 / 运行时注入用的项目 slug 或 id（优先于 options.slug）。
   */
  public static readonly ENV_PROJECT_SLUG = 'PAMENV_PROJECT_SLUG' as const;

  /**
   * 插件 / 运行时注入用的环境名（优先于 options.env）。
   */
  public static readonly ENV_ENV_NAME = 'PAMENV_ENV_NAME' as const;

  /**
   * 应用侧常用的 PAM 环境名（次于 {@link ENV_ENV_NAME}，优先于 options.env）。
   */
  public static readonly ENV_PAM_ENV = 'PAM_ENV' as const;

  /**
   * 注入调试开关（`1` / `true` 开启）；`options.debug` 未传时默认读此变量。
   */
  public static readonly ENV_DEBUG = 'PAMENV_DEBUG' as const;

  /**
   * 全局总开关：`0` / `false` / `off` / `no` 时关闭插件注入与 runtime 解封。
   * 未设置则不干预（仍由 options.enabled / 自动时机决定）。
   */
  public static readonly ENV_ENABLED = 'PAMENV_ENABLED' as const;

  /**
   * @returns 去空白后的 `PAMENV_TOKEN`，未设置则为 null
   */
  public static getEnvToken(): string | null {
    const token = process.env[this.ENV_TOKEN]?.trim();
    return token || null;
  }

  /**
   * @returns 去空白后的 `PAMENV_BASE_URL`，未设置则为 null
   */
  public static getEnvBaseUrl(): string | null {
    const url = process.env[this.ENV_BASE_URL]?.trim();
    return url || null;
  }

  /**
   * @returns Absolute path to `~/.pam`
   */
  public static getHomeRoot(): string {
    const home = process.env.HOME || process.env.USERPROFILE || '.';
    return join(home, this.PAM_DIR_NAME);
  }

  /**
   * @returns Absolute path to `~/.pam/config.json`
   */
  public static getConfigPath(): string {
    return join(this.getHomeRoot(), this.CONFIG_FILE_NAME);
  }

  /**
   * @returns Absolute path to `~/.pam/sync`
   */
  public static getSyncRoot(): string {
    return join(this.getHomeRoot(), this.SYNC_DIR_NAME);
  }

  /**
   * @param projectId - Project uuid
   * @param envName - Environment name
   * @returns Absolute snapshot JSON path under home
   */
  public static getSyncSnapshotPath(projectId: string, envName: string): string {
    const safeEnv = envName.trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
    return join(this.getSyncRoot(), projectId, `${safeEnv}.json`);
  }

  /**
   * @param cwd - Working directory (usually process.cwd() or `-o`)
   * @returns Absolute path to `{cwd}/.pam` (exact; does not walk ancestors)
   */
  public static getLocalRoot(cwd: string): string {
    return join(resolve(cwd), this.PAM_DIR_NAME);
  }

  /**
   * @param cwd - Working directory
   * @returns Absolute path to `{cwd}/.pam/config.json`
   */
  public static getLocalConfigPath(cwd: string): string {
    return join(this.getLocalRoot(cwd), this.CONFIG_FILE_NAME);
  }

  /**
   * Whether `{cwd}/.pam` exists as a directory (exact; no ancestor walk).
   *
   * @param cwd - Working directory
   */
  public static hasLocalPamRoot(cwd: string): boolean {
    return this.isPamDirectory(this.getLocalRoot(cwd));
  }

  /**
   * Walks from `startDir` upward and returns the nearest **project** `.pam`
   * directory (absolute), or `null` if none exists within bounds.
   *
   * Bounds (stop after checking the current directory):
   * - {@link MAX_PAM_WALK_UP_DEPTH} parent hops
   * - nearest `.git` (file or directory) — do not leave the work tree
   * - filesystem root
   *
   * Skips the global home root (`~/.pam`) so paths under the user profile
   * do not treat home credentials as a monorepo-local identity.
   *
   * Enables monorepo: login once at the repo root, use from `apps/*`.
   *
   * @param startDir - Directory to start walking from
   */
  public static findNearestPamRoot(startDir: string): string | null {
    let dir = resolve(startDir);
    const { root } = parse(dir);
    const homePam = this.getHomeRoot();

    for (let hop = 0; hop <= this.MAX_PAM_WALK_UP_DEPTH; hop++) {
      const candidate = join(dir, this.PAM_DIR_NAME);
      if (
        this.isPamDirectory(candidate) &&
        !this.isSamePath(candidate, homePam)
      ) {
        return resolve(candidate);
      }

      // Checked this dir; do not ascend past the git work tree or FS root.
      if (this.hasGitMarker(dir) || dir === root) {
        break;
      }
      const parent = dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }

    return null;
  }

  /**
   * Directory that owns the nearest `.pam` (parent of `.pam`), or `null`.
   *
   * @param startDir - Directory to start walking from
   */
  public static resolveLocalWorkingDir(startDir: string): string | null {
    const pamRoot = this.findNearestPamRoot(startDir);
    return pamRoot ? dirname(pamRoot) : null;
  }

  /**
   * Whether the working directory already has an isolated CLI login file.
   *
   * @param cwd - Working directory
   */
  public static hasLocalConfig(cwd: string): boolean {
    return existsSync(this.getLocalConfigPath(cwd));
  }

  /**
   * Picks local vs home auth root.
   *
   * Priority: `--global` → home; `--local` → cwd; else auto if a nearest
   * ancestor `{dir}/.pam` exists (never bleed global creds into a local
   * workspace).
   *
   * @param options.local - Explicit `--local`
   * @param options.global - Explicit `--global`
   * @param options.workingDir - Directory to probe for local `.pam`
   */
  public static resolvePreferLocal(options: {
    readonly local?: boolean;
    readonly global?: boolean;
    readonly workingDir: string;
  }): boolean {
    if (options.global) {
      return false;
    }
    if (options.local) {
      return true;
    }
    return this.findNearestPamRoot(options.workingDir) !== null;
  }

  /**
   * Working directory used for `{workingDir}/.pam` when preferLocal is true.
   *
   * - `--local`: always the given `workingDir` (login creates cwd/.pam)
   * - auto: nearest ancestor that already has `.pam`, else `workingDir`
   * - `--global`: unused for auth paths (caller should not prefer local)
   *
   * @param options - Same flags as {@link resolvePreferLocal}
   */
  public static resolveAuthWorkingDir(options: {
    readonly local?: boolean;
    readonly global?: boolean;
    readonly workingDir: string;
  }): string {
    const start = resolve(options.workingDir);
    if (options.global) {
      return start;
    }
    if (options.local) {
      return start;
    }
    return this.resolveLocalWorkingDir(start) ?? start;
  }

  /**
   * @param cwd - Working directory
   * @returns Absolute path to `{cwd}/.pam/sync`
   */
  public static getLocalSyncRoot(cwd: string): string {
    return join(this.getLocalRoot(cwd), this.SYNC_DIR_NAME);
  }

  /**
   * @param cwd - Working directory
   * @param projectId - Project uuid
   * @param envName - Environment name
   * @returns Absolute local snapshot path
   */
  public static getLocalSyncSnapshotPath(
    cwd: string,
    projectId: string,
    envName: string
  ): string {
    const safeEnv = envName.trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
    return join(this.getLocalSyncRoot(cwd), projectId, `${safeEnv}.json`);
  }

  /**
   * @param input - Raw locale string
   * @returns Normalized locale or null when unsupported
   */
  public static parseLocale(input: string): 'en' | 'zh' | null {
    const normalized = input.trim().toLowerCase();
    if (
      (this.SUPPORTED_LOCALES as readonly string[]).includes(normalized)
    ) {
      return normalized as 'en' | 'zh';
    }
    return null;
  }

  /**
   * Normalizes PAM host / URL to an origin without trailing slash.
   *
   * Bare hosts (`pam.localhost:3400`) get `http://` for localhost / private
   * IPs and `https://` otherwise. Values that already include a scheme are
   * only trimmed of trailing slashes.
   *
   * @param input - Full URL or bare host[:port]
   */
  public static normalizeOrigin(input: string): string {
    const trimmed = input.trim().replace(/\/+$/, '');
    if (!trimmed) {
      return this.DEFAULT_BASE_URL;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/\/+$/, '');
    }

    const host = trimmed.split('/')[0] || trimmed;
    const scheme = this.shouldUseHttp(host) ? 'http' : 'https';
    return `${scheme}://${host}`;
  }

  /**
   * Builds a browser URL for the project general tab.
   *
   * @param baseUrl - PAM origin (domain)
   * @param locale - UI locale segment (`en` | `zh`)
   * @param slug - Project slug
   * @returns Absolute URL like `{baseUrl}/{locale}/projects/{slug}/general`
   */
  public static buildProjectGeneralUrl(
    baseUrl: string,
    locale: string,
    slug: string
  ): string {
    const origin = this.normalizeOrigin(baseUrl);
    const lang = this.parseLocale(locale) || this.DEFAULT_LOCALE;
    return `${origin}/${lang}/projects/${encodeURIComponent(slug)}/general`;
  }

  protected static shouldUseHttp(host: string): boolean {
    const hostname = host.replace(/^\[|\]$/g, '').split(':')[0]?.toLowerCase();
    if (!hostname) {
      return false;
    }
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return true;
    }
    if (hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }
    // RFC1918-ish private IPv4
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }
    return false;
  }

  protected static isPamDirectory(path: string): boolean {
    try {
      return existsSync(path) && statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  /** True when `dir` is a git work tree root (`.git` file or directory). */
  protected static hasGitMarker(dir: string): boolean {
    return existsSync(join(dir, '.git'));
  }

  /**
   * Path equality for existing paths. Prefers device+inode so Windows 8.3
   * short names (`ADMINI~1`) match the long form (`Administrator`);
   * `realpath` alone does not expand 8.3 on Windows.
   */
  protected static isSamePath(a: string, b: string): boolean {
    try {
      if (existsSync(a) && existsSync(b)) {
        const sa = statSync(a);
        const sb = statSync(b);
        if (sa.dev === sb.dev && sa.ino === sb.ino && sa.ino !== 0) {
          return true;
        }
        if (realpathSync(a) === realpathSync(b)) {
          return true;
        }
      }
    } catch {
      // fall through
    }
    const left = resolve(a);
    const right = resolve(b);
    if (process.platform === 'win32') {
      return left.toLowerCase() === right.toLowerCase();
    }
    return left === right;
  }
}
