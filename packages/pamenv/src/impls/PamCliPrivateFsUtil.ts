import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { chmod, mkdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { PamCliI18n } from '../i18n/PamCliI18n';
import { PAMENV_CLI_FILE_TOO_PERMISSIVE } from '../i18n/identifier/pamenv_cli';

const execFileAsync = promisify(execFile);
let windowsAccount: string | null | undefined;
const windowsRestrictedPaths = new Set<string>();

/**
 * Writes pamenv local state with restrictive filesystem modes.
 *
 * Significance: Token, sync baselines, and pulled secrets must not be world-readable.
 * Core idea: Prefer `0700` dirs and `0600` files; atomic temp+rename; refuse
 * overwriting an existing file that is group/other-readable on POSIX.
 * Main function: mkdir / write helpers used by auth, sync, and pull/push.
 * Main purpose: Reduce local secret leakage on shared machines (POSIX modes, Windows DACL).
 *
 * @example
 * await PamCliPrivateFsUtil.writePrivateFile(path, body);
 */
export class PamCliPrivateFsUtil {
  public static readonly FILE_MODE = 0o600 as const;
  public static readonly DIR_MODE = 0o700 as const;

  /**
   * Ensures a directory exists with owner-only access when the OS supports it.
   *
   * @param dirPath - Absolute directory path
   */
  public static async mkdirPrivate(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true, mode: this.DIR_MODE });
    await this.tryChmod(dirPath, this.DIR_MODE);
    await this.restrictWindowsDacl(dirPath);
  }

  /**
   * Best-effort: set an existing file to owner-only (`0600`) on POSIX.
   * Used when rewriting our own config after vault migration (legacy files
   * may have been created with a loose umask). Does not create the file.
   *
   * @param filePath - Absolute file path
   */
  public static async ensurePrivateFileMode(filePath: string): Promise<void> {
    if (process.platform === 'win32') {
      return;
    }
    try {
      await chmod(filePath, this.FILE_MODE);
    } catch {
      // Missing path or unsupported FS — writePrivateFile will create fresh.
    }
  }

  /**
   * Refuses to overwrite a file that is readable by group or others (POSIX).
   * No-op when the path does not exist or the platform has no mode bits.
   *
   * @param filePath - Absolute file path
   */
  public static async assertNotGroupOrWorldReadable(
    filePath: string
  ): Promise<void> {
    if (process.platform === 'win32') {
      return;
    }
    let mode: number;
    try {
      mode = (await stat(filePath)).mode;
    } catch {
      return;
    }
    // group read (0o040) or other read (0o004)
    if ((mode & 0o044) !== 0) {
      throw new Error(
        PamCliI18n.t(PAMENV_CLI_FILE_TOO_PERMISSIVE, { path: filePath })
      );
    }
  }

  /**
   * Writes a UTF-8 file with owner read/write only (`0600` on POSIX).
   * Uses temp + rename so a failed write does not leave a partial secret file.
   *
   * @param filePath - Absolute file path
   * @param content - File body
   */
  public static async writePrivateFile(
    filePath: string,
    content: string
  ): Promise<void> {
    await this.assertNotGroupOrWorldReadable(filePath);
    const dir = dirname(filePath);
    await this.mkdirPrivate(dir);
    const tempPath = join(
      dir,
      `.pamenv-write-${process.pid}-${randomBytes(8).toString('hex')}.tmp`
    );
    try {
      await writeFile(tempPath, content, {
        encoding: 'utf8',
        mode: this.FILE_MODE
      });
      await this.tryChmod(tempPath, this.FILE_MODE);
      await rename(tempPath, filePath);
      await this.tryChmod(filePath, this.FILE_MODE);
      await this.restrictWindowsDacl(filePath);
    } catch (error) {
      try {
        await unlink(tempPath);
      } catch {
        // ignore cleanup failures
      }
      throw error;
    }
  }

  /**
   * Windows 上 chmod 无效。一次 icacls：显式授权当前用户，并去掉
   * Everyone / Authenticated Users / Users。授权失败则不改 ACL，避免把自己锁在外面。
   *
   * @param targetPath - 文件或目录
   */
  protected static async restrictWindowsDacl(targetPath: string): Promise<void> {
    if (process.platform !== 'win32') {
      return;
    }
    const normalized = targetPath.toLowerCase();
    if (windowsRestrictedPaths.has(normalized)) {
      return;
    }
    const account = await PamCliPrivateFsUtil.resolveWindowsAccount();
    if (!account) {
      return;
    }
    try {
      await execFileAsync(
        'icacls',
        [
          targetPath,
          '/inheritance:d',
          '/grant:r',
          `${account}:(F)`,
          '/remove:g',
          '*S-1-1-0',
          '*S-1-5-11',
          '*S-1-5-32-545'
        ],
        { windowsHide: true }
      );
      windowsRestrictedPaths.add(normalized);
    } catch {
      // 收紧失败不阻断写入；POSIX 仍依赖 0600。
    }
  }

  /**
   * @returns 当前 Windows 账户（`DOMAIN\\user`），失败时为 null
   */
  protected static async resolveWindowsAccount(): Promise<string | null> {
    if (windowsAccount !== undefined) {
      return windowsAccount;
    }
    try {
      const { stdout } = await execFileAsync('whoami', [], {
        windowsHide: true
      });
      const account = String(stdout).trim();
      windowsAccount = account || null;
    } catch {
      windowsAccount = null;
    }
    return windowsAccount;
  }

  /**
   * Best-effort chmod; ignored when the platform does not support Unix modes.
   *
   * @param targetPath - File or directory
   * @param mode - POSIX mode bits
   */
  protected static async tryChmod(
    targetPath: string,
    mode: number
  ): Promise<void> {
    try {
      await chmod(targetPath, mode);
    } catch {
      // Windows and some FS backends ignore or reject Unix modes.
    }
  }
}
