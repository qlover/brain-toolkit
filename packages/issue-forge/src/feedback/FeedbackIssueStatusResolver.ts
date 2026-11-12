import {
  FeedbackIssueStatus,
  type FeedbackGithubIssueEventType,
  type FeedbackIssueStatusType
} from './types';

const ISSUE_ACTION_CLOSED = 'closed';
const ISSUE_ACTION_REOPENED = 'reopened';
const REASON_NOT_PLANNED = 'not_planned';
const REASON_DUPLICATE = 'duplicate';

/**
 * GitHub Issue 动作 + 关闭原因 → 反馈状态（基本实现）。
 */
export class FeedbackIssueStatusResolver {
  public resolve(
    event: FeedbackGithubIssueEventType
  ): FeedbackIssueStatusType | null {
    if (event.action === ISSUE_ACTION_REOPENED) {
      return FeedbackIssueStatus.open;
    }
    if (event.action !== ISSUE_ACTION_CLOSED) {
      return null;
    }
    const reason = event.issue.state_reason ?? null;
    if (reason === REASON_NOT_PLANNED || reason === REASON_DUPLICATE) {
      return FeedbackIssueStatus.closed;
    }
    return FeedbackIssueStatus.resolved;
  }
}
