import {
  PAMENV_CLI_API_ENV_PROTECTED,
  PAMENV_CLI_API_FORBIDDEN,
  PAMENV_CLI_API_UNAUTHORIZED
} from '../i18n/identifier/pamenv_cli';
import { PamCliI18n } from '../i18n/PamCliI18n';
import type { PamCliAuthStoreInterface } from '../interfaces/PamCliAuthStoreInterface';
import { PamCliApiError } from './PamCliApiError';

export type PamCliDisplayErrorOptionsType = {
  readonly authStore?: PamCliAuthStoreInterface;
  /**
   * 为 true 时保留原 stack（如 `PAMENV_DEBUG=1`）；
   * 默认去掉堆栈，避免 Vite/Next 刷屏。
   */
  readonly keepStack?: boolean;
};

/**
 * 把 PAM / 注入错误收成可读文案，供 CLI stderr 与 Vite/Next 插件共用。
 */
export class PamCliErrorPresenter {
  /**
   * 多行可读说明（含翻译、id / requestId / httpStatus）。
   */
  public static async format(
    error: unknown,
    authStore?: PamCliAuthStoreInterface
  ): Promise<string> {
    if (error instanceof PamCliApiError) {
      if (authStore) {
        await PamCliI18n.hydrateFromApiOnce(authStore);
      }
      return error.formatForCli((id) => PamCliI18n.lookup(id), {
        friendlyHeadline: this.resolveAuthFriendlyHeadline(error)
      });
    }
    return error instanceof Error ? error.message : String(error);
  }

  /**
   * 生成给插件抛出的 Error：message 为可读多行文案；默认无 stack。
   */
  public static async toDisplayError(
    error: unknown,
    options?: PamCliDisplayErrorOptionsType
  ): Promise<Error> {
    const message = await this.format(error, options?.authStore);
    const display = new Error(message);
    display.name =
      error instanceof PamCliApiError ? 'PamCliApiError' : 'Error';
    if (options?.keepStack === true && error instanceof Error && error.stack) {
      display.stack = error.stack;
    } else {
      display.stack = undefined;
    }
    return display;
  }

  /**
   * 401/403 友好标题；其它状态返回 undefined。
   */
  public static resolveAuthFriendlyHeadline(
    error: PamCliApiError
  ): string | undefined {
    if (error.httpStatus === 401) {
      return PamCliI18n.t(PAMENV_CLI_API_UNAUTHORIZED);
    }
    if (error.httpStatus !== 403) {
      return undefined;
    }
    if (
      error.id === 'api:pam_env_protected' ||
      error.id.endsWith(':pam_env_protected')
    ) {
      return PamCliI18n.t(PAMENV_CLI_API_ENV_PROTECTED);
    }
    return PamCliI18n.t(PAMENV_CLI_API_FORBIDDEN);
  }
}
