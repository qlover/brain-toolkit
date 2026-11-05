/**
 * Structured PAM API failure for the CLI.
 *
 * Significance: Preserves NextKit `id` (i18n key) instead of collapsing to a string.
 * Core idea: `id` is the stable business error code; `message` / `data` are extras.
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
        : params.id);
    super(detail);
    this.name = 'PamCliApiError';
    this.id = params.id;
    this.requestId = params.requestId;
    this.data = params.data;
    this.httpStatus = params.httpStatus;
  }

  /**
   * Multi-line CLI output: localized / friendly text, plus id / requestId.
   *
   * @param translate - Optional `id` → localized string lookup (PAM `api:*`)
   * @param options.friendlyHeadline - Prefer this over raw API message (401/403)
   */
  public formatForCli(
    translate?: (id: string) => string | undefined,
    options?: { readonly friendlyHeadline?: string }
  ): string {
    const localized = translate?.(this.id)?.trim();
    const friendly = options?.friendlyHeadline?.trim();
    const headline = friendly || localized || this.message;
    const lines = [headline];

    // Keep a short server detail when it adds info beyond the friendly line.
    if (
      friendly &&
      localized &&
      localized !== friendly &&
      localized !== this.id
    ) {
      lines.push(localized);
    } else if (
      friendly &&
      this.message?.trim() &&
      this.message.trim() !== friendly &&
      this.message.trim() !== this.id &&
      this.message.trim() !== localized
    ) {
      lines.push(this.message.trim());
    }

    if (this.id && this.id !== headline) {
      lines.push(`id: ${this.id}`);
    }
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
