import { isRequestAdapterResponse } from '@qlover/fe-corekit/request';
import {
  isI18nKey,
  isNextKitApiError,
  type I18nServiceInterface,
  type NextKitApiError
} from '@qlover/next-kit/common';
import { COMMON_API_REQUEST_FAILED } from '@config/i18n-identifier/common/common';
import type { ExecutorError } from '@qlover/fe-corekit/executor';

export type PamApiErrorDisplayOptionsType = {
  /** 缺译时的兜底 i18n key；默认 {@link COMMON_API_REQUEST_FAILED} */
  readonly fallbackKey?: string;
  /** 是否在文案后附加 requestId（便于排障） */
  readonly appendRequestId?: boolean;
};

/**
 * 把 API / ExecutorError 收成用户可读文案。
 *
 * 优先 `t(api:*)`；若翻译结果仍是裸 key，则用统一兜底，避免弹窗出现 `api:xxx`。
 */
export class PamApiErrorDisplay {
  /**
   * 从错误 id 解析展示文案。
   */
  public static resolveFromId(
    i18n: I18nServiceInterface,
    errorId: string,
    options?: PamApiErrorDisplayOptionsType & {
      readonly requestId?: string;
    }
  ): string {
    const fallbackKey = options?.fallbackKey ?? COMMON_API_REQUEST_FAILED;
    let text = '';

    if (isI18nKey(errorId)) {
      const translated = i18n.t(errorId)?.trim() || '';
      if (translated && translated !== errorId) {
        text = translated;
      }
    }

    if (!text) {
      const fallback = i18n.t(fallbackKey)?.trim() || '';
      text =
        fallback && fallback !== fallbackKey
          ? fallback
          : 'Request failed. Please try again later.';
    }

    if (options?.appendRequestId !== false && options?.requestId?.trim()) {
      return `${text}\nrequestId: ${options.requestId.trim()}`;
    }
    return text;
  }

  /**
   * 从 ExecutorError 解析（含 cause 上的 requestId）。
   */
  public static resolveFromExecutorError(
    i18n: I18nServiceInterface,
    error: ExecutorError,
    options?: PamApiErrorDisplayOptionsType
  ): string {
    return this.resolveFromId(i18n, error.id, {
      ...options,
      requestId: this.peekRequestId(error.cause)
    });
  }

  /**
   * 从 NextKit 错误信封解析。
   */
  public static resolveFromEnvelope(
    i18n: I18nServiceInterface,
    envelope: NextKitApiError,
    options?: PamApiErrorDisplayOptionsType
  ): string {
    return this.resolveFromId(i18n, envelope.id, {
      ...options,
      requestId: envelope.requestId
    });
  }

  /**
   * 从任意 thrown 值尽量抽出 requestId。
   */
  public static peekRequestId(cause: unknown): string | undefined {
    if (isNextKitApiError(cause)) {
      return cause.requestId;
    }
    if (isRequestAdapterResponse(cause) && isNextKitApiError(cause.data)) {
      return cause.data.requestId;
    }
    return undefined;
  }
}
