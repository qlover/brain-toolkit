import type { FeedbackIssueHostInterface } from './FeedbackIssueHostInterface';
import { FeedbackIssueStatusResolver } from './FeedbackIssueStatusResolver';
import type {
  FeedbackGithubIssueEventType,
  FeedbackIssueLoggerInterface
} from './types';

export type FeedbackIssueStatusSyncEngineOptionsType = {
  readonly host: FeedbackIssueHostInterface;
  readonly statusResolver?: FeedbackIssueStatusResolver;
  readonly logger?: FeedbackIssueLoggerInterface;
};

/**
 * Issue 事件 → 反馈状态回写（基本实现，GitHub issues）。
 */
export class FeedbackIssueStatusSyncEngine {
  protected readonly host: FeedbackIssueHostInterface;
  protected readonly statusResolver: FeedbackIssueStatusResolver;
  protected readonly logger: FeedbackIssueLoggerInterface | undefined;

  constructor(options: FeedbackIssueStatusSyncEngineOptionsType) {
    this.host = options.host;
    this.statusResolver =
      options.statusResolver ?? new FeedbackIssueStatusResolver();
    this.logger = options.logger;
  }

  public async applyIssueEvent(
    event: FeedbackGithubIssueEventType
  ): Promise<number> {
    const status = this.statusResolver.resolve(event);
    if (status === null) {
      return 0;
    }
    if (!(await this.isFeedbackRepo(event.repository.full_name))) {
      this.logger?.warn('feedback status sync skipped: repo mismatch', {
        repo: event.repository.full_name
      });
      return 0;
    }
    const updated = await this.host.updateStatusByIssueNumber(
      event.issue.number,
      status
    );
    if (updated > 0) {
      this.logger?.info('feedback status synced from github issue', {
        issueNumber: event.issue.number,
        action: event.action,
        status,
        updated
      });
    }
    return updated;
  }

  protected async isFeedbackRepo(fullName: string): Promise<boolean> {
    const repo = await this.host.getFeedbackRepoFullName();
    return repo.toLowerCase() === fullName.trim().toLowerCase();
  }
}
