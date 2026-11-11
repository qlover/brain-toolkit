import { timingSafeEqual } from 'node:crypto';
import { ExecutorError } from '@qlover/fe-corekit';
import { injectable } from '@shared/container';
import {
  ENV_DUMP_ALLOWLIST,
  ENV_DUMP_ENABLED_KEY,
  ENV_DUMP_TOKEN_KEY
} from '@config/EnvDumpConfig';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';

export type EnvDumpResultType = {
  readonly dotenv: string;
  readonly presentKeys: readonly string[];
  readonly missingKeys: readonly string[];
};

/**
 * 按白名单从 `process.env` 导出 dotenv 文本（临时急救用）。
 */
@injectable()
export class EnvDumpService {
  /**
   * 校验开关与 token 后导出白名单键。
   *
   * @param tokenHeader - 请求头中的 dump token
   * @param actorUserId - 已通过 Brain admin 校验的用户 id（仅审计）
   */
  public dump(
    tokenHeader: string | null,
    actorUserId: string
  ): EnvDumpResultType {
    if (!this.isDumpEnabled()) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }
    if (!this.tokenMatches(tokenHeader)) {
      throw new ExecutorError(API_NOT_AUTHORIZED);
    }

    const presentKeys: string[] = [];
    const missingKeys: string[] = [];
    const lines: string[] = [
      '# temporary env dump from running brain-oauth — do not commit',
      `# actor=${actorUserId} at=${new Date().toISOString()}`
    ];

    for (const key of ENV_DUMP_ALLOWLIST) {
      const value = process.env[key];
      if (typeof value === 'string' && value.length > 0) {
        presentKeys.push(key);
        lines.push(`${key}=${this.escapeDotenvValue(value)}`);
      } else {
        missingKeys.push(key);
      }
    }

    // 只记键名，不记值。
    console.warn(
      `[env-dump] actor=${actorUserId} present=${presentKeys.length} missing=${missingKeys.length} keys=${presentKeys.join(',')}`
    );

    return {
      dotenv: `${lines.join('\n')}\n`,
      presentKeys,
      missingKeys
    };
  }

  protected isDumpEnabled(): boolean {
    const raw = process.env[ENV_DUMP_ENABLED_KEY]?.trim().toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes';
  }

  protected tokenMatches(tokenHeader: string | null): boolean {
    const expected = process.env[ENV_DUMP_TOKEN_KEY]?.trim() ?? '';
    const actual = tokenHeader?.trim() ?? '';
    if (!expected || !actual) {
      return false;
    }
    const a = Buffer.from(actual);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  }

  /**
   * 含空白或特殊字符时加双引号，内部 `"` / `\` / 换行做转义。
   */
  protected escapeDotenvValue(value: string): string {
    if (!/[\s#"']/.test(value) && !value.includes('\\')) {
      return value;
    }
    return `"${value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')}"`;
  }
}
