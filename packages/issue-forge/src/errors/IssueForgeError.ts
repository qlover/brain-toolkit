/**
 * Forge API 调用失败（换票、建 Issue、上传等）。
 */
export class IssueForgeError extends Error {
  public readonly code = 'ISSUE_FORGE_FAILED' as const;
  /** HTTP 状态码；网络错误等无响应时为 null */
  public readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = 'IssueForgeError';
    this.status = status;
  }
}
