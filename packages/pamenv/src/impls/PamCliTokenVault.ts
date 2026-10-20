import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { PamCliPrivateFsUtil } from './PamCliPrivateFsUtil';

const execFileAsync = promisify(execFile);

export type PamCliTokenVaultEntryType = {
  readonly token: string;
  readonly email: string;
};

/**
 * 把 CLI Bearer token 从 config.json 挪到 OS 绑定的私密存储。
 *
 * 存在意义：config.json 易被备份/同步误传；token 应尽量落在当前用户才能解的存储里。
 * 核心思路：Windows 用 DPAPI（CurrentUser）加密文件；macOS 用登录钥匙串；
 * 其它平台仍用 0600 私有文件。进程内缓存，避免每次调 PowerShell / security。
 * 主要用途：{@link PamCliAuthStore} 读写登录态。
 */
export class PamCliTokenVault {
  public static readonly SERVICE = 'pamenv-cli' as const;
  public static readonly FILE_NAME = 'credentials.enc' as const;

  protected static readonly memoryCache = new Map<
    string,
    PamCliTokenVaultEntryType | null
  >();

  /**
   * @param pamRoot - 活跃的 `.pam` 根目录
   */
  public static cacheKey(pamRoot: string): string {
    return createHash('sha256').update(pamRoot).digest('hex').slice(0, 24);
  }

  public static credentialsPath(pamRoot: string): string {
    return join(pamRoot, this.FILE_NAME);
  }

  /**
   * @param pamRoot - `.pam` 根
   * @returns 凭证或 null
   */
  public static async read(
    pamRoot: string
  ): Promise<PamCliTokenVaultEntryType | null> {
    const key = this.cacheKey(pamRoot);
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) ?? null;
    }

    let entry: PamCliTokenVaultEntryType | null = null;
    try {
      if (process.platform === 'darwin') {
        entry = await this.readMacKeychain(key);
      } else if (process.platform === 'win32') {
        entry = await this.readWindowsDpapi(pamRoot);
      } else {
        entry = await this.readPrivateFile(pamRoot);
      }
    } catch {
      entry = null;
    }

    this.memoryCache.set(key, entry);
    return entry;
  }

  /**
   * @param pamRoot - `.pam` 根
   * @param entry - token + email
   */
  public static async write(
    pamRoot: string,
    entry: PamCliTokenVaultEntryType
  ): Promise<void> {
    const key = this.cacheKey(pamRoot);
    if (process.platform === 'darwin') {
      await this.writeMacKeychain(key, entry);
    } else if (process.platform === 'win32') {
      await this.writeWindowsDpapi(pamRoot, entry);
    } else {
      await this.writePrivateFile(pamRoot, entry);
    }
    this.memoryCache.set(key, entry);
  }

  /**
   * @param pamRoot - `.pam` 根
   */
  public static async clear(pamRoot: string): Promise<void> {
    const key = this.cacheKey(pamRoot);
    try {
      if (process.platform === 'darwin') {
        await execFileAsync(
          'security',
          [
            'delete-generic-password',
            '-s',
            this.SERVICE,
            '-a',
            key
          ],
          { windowsHide: true }
        );
      } else {
        await rm(this.credentialsPath(pamRoot), { force: true });
      }
    } catch {
      // 本就没有凭证。
    }
    this.memoryCache.set(key, null);
  }

  /** 测试用：清空进程内缓存。 */
  public static resetMemoryCache(): void {
    this.memoryCache.clear();
  }

  protected static async readPrivateFile(
    pamRoot: string
  ): Promise<PamCliTokenVaultEntryType | null> {
    try {
      const raw = await readFile(this.credentialsPath(pamRoot), 'utf8');
      return this.parseEntry(raw);
    } catch {
      return null;
    }
  }

  protected static async writePrivateFile(
    pamRoot: string,
    entry: PamCliTokenVaultEntryType
  ): Promise<void> {
    await PamCliPrivateFsUtil.writePrivateFile(
      this.credentialsPath(pamRoot),
      `${JSON.stringify(entry)}\n`
    );
  }

  protected static async readMacKeychain(
    account: string
  ): Promise<PamCliTokenVaultEntryType | null> {
    try {
      const { stdout } = await execFileAsync(
        'security',
        ['find-generic-password', '-s', this.SERVICE, '-a', account, '-w'],
        { windowsHide: true }
      );
      return this.parseEntry(String(stdout).trim());
    } catch {
      return null;
    }
  }

  protected static async writeMacKeychain(
    account: string,
    entry: PamCliTokenVaultEntryType
  ): Promise<void> {
    const payload = JSON.stringify(entry);
    await execFileAsync(
      'security',
      [
        'add-generic-password',
        '-U',
        '-s',
        this.SERVICE,
        '-a',
        account,
        '-w',
        payload
      ],
      { windowsHide: true }
    );
  }

  protected static async readWindowsDpapi(
    pamRoot: string
  ): Promise<PamCliTokenVaultEntryType | null> {
    let cipherText: string;
    try {
      cipherText = (await readFile(this.credentialsPath(pamRoot), 'utf8')).trim();
    } catch {
      return null;
    }
    if (!cipherText) {
      return null;
    }
    const script = `
Add-Type -AssemblyName System.Security
$protected = [Convert]::FromBase64String(@'
${cipherText}
'@)
$bytes = [System.Security.Cryptography.ProtectedData]::Unprotect(
  $protected, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[System.Text.Encoding]::UTF8.GetString($bytes)
`;
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, maxBuffer: 2 * 1024 * 1024 }
    );
    return this.parseEntry(String(stdout).trim());
  }

  protected static async writeWindowsDpapi(
    pamRoot: string,
    entry: PamCliTokenVaultEntryType
  ): Promise<void> {
    const payloadB64 = Buffer.from(JSON.stringify(entry), 'utf8').toString(
      'base64'
    );
    const script = `
Add-Type -AssemblyName System.Security
$plain = [Convert]::FromBase64String('${payloadB64}')
$protected = [System.Security.Cryptography.ProtectedData]::Protect(
  $plain, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[Convert]::ToBase64String($protected)
`;
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, maxBuffer: 2 * 1024 * 1024 }
    );
    const cipherText = String(stdout).trim();
    if (!cipherText) {
      throw new Error('DPAPI protect returned empty ciphertext');
    }
    await PamCliPrivateFsUtil.writePrivateFile(
      this.credentialsPath(pamRoot),
      `${cipherText}\n`
    );
  }

  protected static parseEntry(raw: string): PamCliTokenVaultEntryType | null {
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<PamCliTokenVaultEntryType>;
      const token = typeof parsed.token === 'string' ? parsed.token.trim() : '';
      const email = typeof parsed.email === 'string' ? parsed.email : '';
      if (!token) {
        return null;
      }
      return { token, email };
    } catch {
      // 旧格式：整段就是 token
      const token = raw.trim();
      return token ? { token, email: '' } : null;
    }
  }
}
