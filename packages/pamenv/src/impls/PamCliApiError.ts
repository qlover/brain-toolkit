/**
 * PAM API 结构化失败：保留 NextKit `id`（i18n key），不压成含糊字符串。
 *
 * `id` 是稳定业务码；`message` / `data` / `httpStatus` / `requestId` 供展示与排障。
 * 插件场景请经 {@link PamCliErrorPresenter.toDisplayError} 再抛，避免刷 stack。
 */
export class PamCliApiError extends Error {
  public readonly id: string;
  public readonly requestId?: string;
  public readonly data?: unknown;
  public readonly httpStatus: number;

  constructor(params: {
    readonly id: string;
    readonly message?: string;
    readonly requestId?: string;
    readonly data?: unknown;
    readonly httpStatus: number;
  }) {
    const detail =
      params.message?.trim() ||
      (params.data !== undefined
        ? `${params.id} ${safeJson(params.data)}`
        : `PAM API error (HTTP ${String(params.httpStatus)}): ${params.id}`);
    super(detail);
    this.name = 'PamCliApiError';
    this.id = params.id;
    this.requestId = params.requestId;
    this.data = params.data;
    this.httpStatus = params.httpStatus;
  }

  /**
   * 多行可读输出：友好/本地化标题 + id / requestId / httpStatus / data。
   *
   * @param translate - 可选：`id` → 本地化文案（PAM `api:*`）
   * @param options.friendlyHeadline - 优先于原始 API message（401/403）
   */
  public formatForCli(
    translate?: (id: string) => string | undefined,
    options?: { readonly friendlyHeadline?: string }
  ): string {
    const localized = translate?.(this.id)?.trim();
    const friendly = options?.friendlyHeadline?.trim();
    const rawMessage = this.message?.trim() || '';
    const headline = friendly || localized || rawMessage || this.id;
    const lines = [headline];

    if (
      friendly &&
      localized &&
      localized !== friendly &&
      localized !== this.id
    ) {
      lines.push(localized);
    } else if (
      friendly &&
      rawMessage &&
      rawMessage !== friendly &&
      rawMessage !== this.id &&
      rawMessage !== localized
    ) {
      lines.push(rawMessage);
    }

    if (this.id && !headline.includes(this.id)) {
      lines.push(`id: ${this.id}`);
    }
    lines.push(`httpStatus: ${String(this.httpStatus)}`);
    if (this.requestId) {
      lines.push(`requestId: ${this.requestId}`);
    }
    if (this.data !== undefined) {
      lines.push(`data: ${safeJson(this.data)}`);
    }
    return lines.join('\n');
  }
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
