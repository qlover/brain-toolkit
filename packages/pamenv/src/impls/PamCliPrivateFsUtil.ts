import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Writes pamenv local state with restrictive filesystem modes.
 *
 * Significance: Token, sync baselines, and pulled secrets must not be world-readable.
 * Core idea: Prefer `0700` dirs and `0600` files; re-chmod after write (mode on
 * `writeFile` only applies when creating a new file).
 * Main function: mkdir / write helpers used by auth, sync, and pull/push.
 * Main purpose: Reduce local secret leakage on shared Unix machines.
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
  }

  /**
   * Writes a UTF-8 file with owner read/write only (`0600` on POSIX).
   *
   * @param filePath - Absolute file path
   * @param content - File body
   */
  public static async writePrivateFile(
    filePath: string,
    content: string
  ): Promise<void> {
    await this.mkdirPrivate(dirname(filePath));
    await writeFile(filePath, content, {
      encoding: 'utf8',
      mode: this.FILE_MODE
    });
    await this.tryChmod(filePath, this.FILE_MODE);
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
