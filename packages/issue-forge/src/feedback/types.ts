/**
 * 反馈 → Issue 同步状态（与常见业务表字段对齐）。
 */
export const FeedbackIssueSyncStatus = {
  pending: 'pending',
  synced: 'synced',
  failed: 'failed',
  skipped: 'skipped'
} as const;

export type FeedbackIssueSyncStatusType =
  (typeof FeedbackIssueSyncStatus)[keyof typeof FeedbackIssueSyncStatus];

/**
 * 反馈工单状态（可由 Issue 关闭/重开回写）。
 */
export const FeedbackIssueStatus = {
  open: 'open',
  reviewing: 'reviewing',
  resolved: 'resolved',
  closed: 'closed'
} as const;

export type FeedbackIssueStatusType =
  (typeof FeedbackIssueStatus)[keyof typeof FeedbackIssueStatus];

export type FeedbackScreenshotSyncStateType = {
  readonly issueNumber: number | null;
  readonly paths: readonly string[];
  readonly postedCount: number;
};

export type FeedbackIssueSyncFieldsType = {
  readonly status: FeedbackIssueSyncStatusType;
  readonly issueNumber: number | null;
  readonly issueUrl: string | null;
  readonly error: string | null;
};

export type FeedbackIssueSyncOptionsType = {
  readonly manual?: boolean;
};

/**
 * 应用侧决定模板变量与附加 labels；`issueNumber` 非空表示已同步。
 */
export type FeedbackIssueContentResolveType = {
  readonly issueNumber: number | null;
  readonly variables: Readonly<Record<string, string>>;
  readonly labels?: readonly string[];
};

/** GitHub issues webhook 最小字段 */
export type FeedbackGithubIssueEventType = {
  readonly action: string;
  readonly issue: {
    readonly number: number;
    readonly state_reason?: string | null;
  };
  readonly repository: {
    readonly full_name: string;
  };
};

export type FeedbackIssueLoggerInterface = {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
};
