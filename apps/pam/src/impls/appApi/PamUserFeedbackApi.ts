import { PamFeedbackClientContextService } from '@/impls/feedback/PamFeedbackClientContextService';
import { inject, injectable } from '@shared/container';
import {
  API_ADMIN_FEEDBACK,
  API_ADMIN_FEEDBACK_GITHUB_ISSUE,
  API_USER_FEEDBACK,
  API_USER_FEEDBACK_SCREENSHOTS
} from '@config/apiRoutes';
import {
  pamUserFeedbackAdminGithubIssueOkSchema,
  pamUserFeedbackAdminListSchema,
  pamUserFeedbackAdminStatusOkSchema,
  pamUserFeedbackCreateOkSchema,
  pamUserFeedbackListPublicSchema,
  type PamUserFeedbackAdminGithubIssueOkType,
  type PamUserFeedbackAdminItemType,
  type PamUserFeedbackAdminStatusOkType,
  type PamUserFeedbackCategoryType,
  type PamUserFeedbackItemPublicType,
  type PamUserFeedbackStatusType
} from '@schemas/PamUserFeedbackSchema';
import { AppApiRequester } from './AppApiRequester';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

export type PamFeedbackSubmitInputType = {
  readonly category: PamUserFeedbackCategoryType;
  readonly body: string;
  readonly screenshots?: readonly File[];
};

export type PamFeedbackSubmitResultType = {
  readonly item: PamUserFeedbackItemPublicType;
  readonly screenshotsFailed: boolean;
};

/**
 * 用户 / Admin 反馈 API 客户端。
 */
@injectable()
export class PamUserFeedbackApi {
  constructor(
    @inject(AppApiRequester)
    protected readonly appApiRequester: AppApiRequester,
    protected readonly contextService: PamFeedbackClientContextService = new PamFeedbackClientContextService()
  ) {}

  public async submit(
    input: PamFeedbackSubmitInputType
  ): Promise<PamFeedbackSubmitResultType> {
    const clientContext = await this.contextService.collect();
    const response = await this.appApiRequester.post(API_USER_FEEDBACK, {
      category: input.category,
      body: input.body.trim(),
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      clientContext: clientContext ?? undefined
    });
    const envelope = response.data as NextKitApiSuccess<unknown>;
    const created = pamUserFeedbackCreateOkSchema.parse(envelope.data);
    const files = input.screenshots ?? [];
    const screenshotsFailed =
      files.length > 0
        ? !(await this.uploadScreenshots(created.item.id, files))
        : false;
    return { item: created.item, screenshotsFailed };
  }

  public async listOwn(): Promise<readonly PamUserFeedbackItemPublicType[]> {
    const response = await this.appApiRequester.get(API_USER_FEEDBACK);
    const envelope = response.data as NextKitApiSuccess<unknown>;
    return pamUserFeedbackListPublicSchema.parse(envelope.data).items;
  }

  public async listAdmin(): Promise<readonly PamUserFeedbackAdminItemType[]> {
    const response = await this.appApiRequester.get(API_ADMIN_FEEDBACK);
    const envelope = response.data as NextKitApiSuccess<unknown>;
    return pamUserFeedbackAdminListSchema.parse(envelope.data).items;
  }

  public async updateStatus(
    id: string,
    status: PamUserFeedbackStatusType
  ): Promise<PamUserFeedbackAdminStatusOkType> {
    const response = await this.appApiRequester.patch(API_ADMIN_FEEDBACK, {
      id,
      status
    });
    const envelope = response.data as NextKitApiSuccess<unknown>;
    return pamUserFeedbackAdminStatusOkSchema.parse(envelope.data);
  }

  public async createGithubIssue(
    id: string
  ): Promise<PamUserFeedbackAdminGithubIssueOkType> {
    const path = API_ADMIN_FEEDBACK_GITHUB_ISSUE.replace(
      ':id',
      encodeURIComponent(id)
    );
    const response = await this.appApiRequester.post(path, {});
    const envelope = response.data as NextKitApiSuccess<unknown>;
    return pamUserFeedbackAdminGithubIssueOkSchema.parse(envelope.data);
  }

  protected async uploadScreenshots(
    feedbackId: string,
    files: readonly File[]
  ): Promise<boolean> {
    const form = new FormData();
    for (const file of files) {
      form.append('screenshots', file, file.name);
    }
    try {
      const path = API_USER_FEEDBACK_SCREENSHOTS.replace(
        ':id',
        encodeURIComponent(feedbackId)
      );
      const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        body: form
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
