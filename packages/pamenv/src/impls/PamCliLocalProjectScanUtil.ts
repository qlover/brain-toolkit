import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * One local dotenv file mapped to a PAM environment name.
 */
export type PamCliDetectedEnvFileType = {
  readonly fileName: string;
  readonly envName: string;
};

/**
 * Defaults discovered from the working directory for `pamenv init`.
 */
export type PamCliLocalProjectScanType = {
  readonly packageName: string | null;
  readonly description: string;
  /** `package.json` homepage when present and a valid URL. */
  readonly homepageUrl: string;
  readonly repoUrl: string;
  readonly defaultSlug: string;
  readonly defaultName: string;
  readonly envFiles: readonly PamCliDetectedEnvFileType[];
  /** Unique env names derived from env files (`.env` / `.env.local` → `local`). */
  readonly envNames: readonly string[];
};

/**
 * Scans the current directory for package.json, git remote, and `.env*` files.
 *
 * Significance: Supplies interactive defaults for `pamenv init`.
 * Core idea: Best-effort local metadata; never talks to PAM.
 * Main function: Read package / git / dotenv filenames and normalize slug.
 * Main purpose: npm-init-style prompts with sensible starting values.
 *
 * @example
 * const scan = await PamCliLocalProjectScanUtil.scan(process.cwd());
 */
export class PamCliLocalProjectScanUtil {
  /**
   * Builds a PAM slug from a package or display name.
   *
   * Scoped names like `@scope/foo` become `scope-foo`.
   *
   * @param raw - Package name or free-form text
   * @returns Normalized slug (may be empty)
   */
  public static toSlug(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Maps a local dotenv filename to a PAM environment name.
   *
   * - `.env` → `local`
   * - `.env.local` → `local`
   * - `.env.xxx` → `xxx`
   *
   * @param fileName - Basename only
   * @returns Env name, or null when the file is not a dotenv candidate
   */
  public static envNameFromFileName(fileName: string): string | null {
    if (fileName === '.env' || fileName === '.env.local') {
      return 'local';
    }

    const match = /^\.env\.(.+)$/.exec(fileName);
    if (!match) {
      return null;
    }

    const suffix = match[1]!.trim();
    if (!suffix) {
      return null;
    }

    return suffix;
  }

  /**
   * Returns a trimmed http(s) URL, or empty when invalid.
   *
   * @param raw - Candidate URL string
   * @returns Normalized absolute URL or `''`
   */
  public static normalizeHomepageUrl(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      return '';
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }
      return parsed.href;
    } catch {
      return '';
    }
  }

  /**
   * Whether a string is a valid http(s) URL for PAM environment `url`.
   *
   * @param raw - Candidate URL
   */
  public static isValidEnvUrl(raw: string): boolean {
    return this.normalizeHomepageUrl(raw) !== '';
  }

  /**
   * Default environment URL for interactive prompts.
   * Prefers `package.json` homepage, then a normalized git origin when http(s).
   *
   * @param scan - Local scan result (or homepage/repo fields)
   * @returns Valid http(s) URL, or empty when neither source works
   */
  public static defaultEnvUrl(
    scan: Pick<PamCliLocalProjectScanType, 'homepageUrl' | 'repoUrl'>
  ): string {
    if (scan.homepageUrl) {
      return scan.homepageUrl;
    }
    return this.normalizeHomepageUrl(scan.repoUrl);
  }

  /**
   * Converts git remote URLs to https form when possible.
   *
   * @param remoteUrl - Raw `git remote get-url` output
   * @returns HTTPS URL or the trimmed original when conversion is unclear
   */
  public static normalizeGitRemoteUrl(remoteUrl: string): string {
    const trimmed = remoteUrl.trim();
    if (!trimmed) {
      return '';
    }

    const sshMatch = /^git@([^:]+):(.+?)(?:\.git)?$/i.exec(trimmed);
    if (sshMatch) {
      return `https://${sshMatch[1]}/${sshMatch[2]}`;
    }

    const sshProtocol = /^ssh:\/\/git@([^/]+)\/(.+?)(?:\.git)?$/i.exec(trimmed);
    if (sshProtocol) {
      return `https://${sshProtocol[1]}/${sshProtocol[2]}`;
    }

    if (trimmed.endsWith('.git')) {
      return trimmed.slice(0, -4);
    }

    return trimmed;
  }

  /**
   * Takes the last path segment of a git remote as a project name candidate.
   *
   * @param remoteUrl - Raw or normalized remote URL
   * @returns Repository name without `.git`, or empty
   */
  public static repoNameFromRemoteUrl(remoteUrl: string): string {
    const normalized = this.normalizeGitRemoteUrl(remoteUrl);
    if (!normalized) {
      return '';
    }

    try {
      if (normalized.includes('://')) {
        const pathname = new URL(normalized).pathname;
        const parts = pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1] || '';
        return last.replace(/\.git$/i, '');
      }
    } catch {
      // fall through
    }

    const parts = normalized.split(/[/\\]/).filter(Boolean);
    const last = parts[parts.length - 1] || '';
    return last.replace(/\.git$/i, '');
  }

  /**
   * Scans a directory for init defaults.
   *
   * @param cwd - Working directory
   * @returns Scan result (fields may be empty when unavailable)
   */
  public static async scan(cwd: string): Promise<PamCliLocalProjectScanType> {
    const packageJson = await this.readPackageJson(cwd);
    const packageName =
      typeof packageJson?.name === 'string' && packageJson.name.trim()
        ? packageJson.name.trim()
        : null;
    const description =
      typeof packageJson?.description === 'string'
        ? packageJson.description.trim()
        : '';
    const homepageUrl =
      typeof packageJson?.homepage === 'string'
        ? this.normalizeHomepageUrl(packageJson.homepage)
        : '';

    const repoUrl = await this.readGitOriginUrl(cwd);
    const gitRepoName = this.repoNameFromRemoteUrl(repoUrl);

    const defaultName = packageName
      ? packageName.replace(/^@/, '').replace(/\//g, ' ')
      : gitRepoName;
    const defaultSlug = defaultName ? this.toSlug(defaultName) : '';

    const envFiles = await this.listEnvFiles(cwd);
    const envNames = this.uniqueEnvNames(envFiles);

    return {
      packageName,
      description,
      homepageUrl,
      repoUrl,
      defaultSlug,
      defaultName,
      envFiles,
      envNames
    };
  }

  /**
   * Lists dotenv files under a directory (non-recursive).
   *
   * @param cwd - Working directory
   * @returns Detected files with mapped env names
   */
  public static async listEnvFiles(
    cwd: string
  ): Promise<PamCliDetectedEnvFileType[]> {
    let entries: string[] = [];
    try {
      entries = await readdir(cwd);
    } catch {
      return [];
    }

    const files: PamCliDetectedEnvFileType[] = [];
    for (const fileName of entries.sort()) {
      const envName = this.envNameFromFileName(fileName);
      if (!envName) {
        continue;
      }
      files.push({ fileName, envName });
    }
    return files;
  }

  /**
   * Dedupes env names while preserving first-seen order.
   * `.env` / `.env.local` both contribute a single `local`.
   *
   * @param files - Detected dotenv files
   * @returns Unique environment names
   */
  public static uniqueEnvNames(
    files: readonly PamCliDetectedEnvFileType[]
  ): string[] {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const file of files) {
      if (seen.has(file.envName)) {
        continue;
      }
      seen.add(file.envName);
      names.push(file.envName);
    }
    return names;
  }

  protected static async readPackageJson(
    cwd: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const raw = await readFile(join(cwd, 'package.json'), 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  protected static async readGitOriginUrl(cwd: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync(
        'git',
        ['remote', 'get-url', 'origin'],
        {
          cwd,
          windowsHide: true
        }
      );
      return this.normalizeGitRemoteUrl(stdout);
    } catch {
      return '';
    }
  }
}
