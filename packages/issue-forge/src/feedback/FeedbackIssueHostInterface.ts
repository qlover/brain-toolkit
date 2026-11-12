import type { GithubAppAuthConfigType } from '../types/IssueForgeTypes';
import type {
  FeedbackIssueContentResolveType,
  FeedbackIssueStatusType,
  FeedbackIssueSyncFieldsType,
  FeedbackIssueSyncOptionsType,
  FeedbackScreenshotSyncStateType
} from './types';

/**
 * 应用宿主端口：持久化、配置，以及「模板变量由谁填」都在这里。
 */
export interface FeedbackIssueHostInterface {
  /**
   * 不存在返回 null；已有 Issue 时仍返回（`issueNumber` 非空），由引擎跳过创建。
   */
  resolveIssueContent(
    feedbackId: string
  ): Promise<FeedbackIssueContentResolveType | null>;

  updateSync(
    feedbackId: string,
    fields: FeedbackIssueSyncFieldsType
  ): Promise<void>;

  findScreenshotState(
    feedbackId: string
  ): Promise<FeedbackScreenshotSyncStateType | null>;

  compareAndSetScreenshotCount(
    feedbackId: string,
    from: number,
    to: number
  ): Promise<boolean>;

  downloadScreenshot(objectPath: string): Promise<Buffer>;

  /** 截图评论正文（markdown），应用决定写法 */
  formatScreenshotComment(
    imageUrls: readonly string[],
    startIndex: number
  ): string;

  updateStatusByIssueNumber(
    issueNumber: number,
    status: FeedbackIssueStatusType
  ): Promise<number>;

  /**
   * 未开启或凭证不全时返回 null（manual 时可忽略「自动同步」开关）。
   */
  resolveForgeAuth(
    options?: FeedbackIssueSyncOptionsType
  ): Promise<GithubAppAuthConfigType | null>;

  /** 配置的反馈目标仓 `owner/repo`，用于 webhook 校验 */
  getFeedbackRepoFullName(): Promise<string>;
}
