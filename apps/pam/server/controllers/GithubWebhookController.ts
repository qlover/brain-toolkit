import { ExecutorError } from '@qlover/fe-corekit/executor';
import { inject, injectable } from '@shared/container';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import {
  GithubWebhookEvent,
  githubIssueEventSchema,
  githubWebhookResultSchema,
  type GithubWebhookResultType
} from '@schemas/GithubWebhookSchema';
import { PamGithubFeedbackIssueBundle } from '@server/services/feedback-github/PamGithubFeedbackIssueBundle';
import type { LoggerInterface } from '@qlover/logger';

export type GithubWebhookHeadersType = {
  /** `X-GitHub-Event` */
  readonly event: string | null;
  /** `X-Hub-Signature-256` */
  readonly signature: string | null;
};

/**
 * GitHub App Webhook：先校验签名，再按事件分发；未处理的事件返回 updated=0。
 */
@injectable()
export class GithubWebhookController {
  constructor(
    @inject(PamGithubFeedbackIssueBundle)
    protected readonly issueBundle: PamGithubFeedbackIssueBundle,
    @inject(I.Logger)
    protected readonly logger: LoggerInterface
  ) {}

  /**
   * @param rawBody - 原始请求体
   * @param headers - 事件名与签名请求头
   * @throws {ExecutorError} 签名校验失败
   */
  public async handle(
    rawBody: string,
    headers: GithubWebhookHeadersType
  ): Promise<GithubWebhookResultType> {
    const verified = await this.issueBundle.verify(rawBody, headers.signature);
    if (!verified.ok) {
      this.logger.warn('github webhook signature rejected', {
        reason: verified.reason,
        event: headers.event
      });
      throw new ExecutorError(
        API_NOT_AUTHORIZED,
        `github webhook: ${verified.reason}`
      );
    }

    const event = headers.event ?? '';
    let updated = 0;
    if (event === GithubWebhookEvent.issues) {
      const payload = githubIssueEventSchema.parse(JSON.parse(rawBody));
      updated = await this.issueBundle.status.applyIssueEvent(payload);
    }
    return githubWebhookResultSchema.parse({ ok: true, event, updated });
  }
}
