import { inject, injectable } from '@shared/container';
import {
  pamUserFeedbackAdminGithubIssueBodySchema,
  pamUserFeedbackAdminGithubIssueOkSchema,
  pamUserFeedbackAdminListSchema,
  pamUserFeedbackAdminStatusOkSchema,
  pamUserFeedbackAdminStatusPatchSchema,
  pamUserFeedbackCreateBodySchema,
  pamUserFeedbackCreateOkSchema,
  pamUserFeedbackListPublicSchema,
  pamUserFeedbackScreenshotsOkSchema,
  type PamUserFeedbackAdminGithubIssueOkType,
  type PamUserFeedbackAdminListType,
  type PamUserFeedbackAdminStatusOkType,
  type PamUserFeedbackCreateOkType,
  type PamUserFeedbackListPublicType,
  type PamUserFeedbackScreenshotsOkType
} from '@schemas/PamUserFeedbackSchema';
import {
  PamUserFeedbackService,
  type PamFeedbackScreenshotUploadType
} from '@server/services/PamUserFeedbackService';

/**
 * 用户反馈：入参/出参 Zod，委托 Service。
 */
@injectable()
export class PamUserFeedbackController {
  constructor(
    @inject(PamUserFeedbackService)
    protected readonly feedbackService: PamUserFeedbackService
  ) {}

  public async createFeedback(
    body: unknown,
    meta: { readonly userAgent: string | null }
  ): Promise<PamUserFeedbackCreateOkType> {
    const parsed = pamUserFeedbackCreateBodySchema.parse(body);
    const data = await this.feedbackService.createForCurrentUser(parsed, meta);
    return pamUserFeedbackCreateOkSchema.parse(data);
  }

  public async listOwnFeedback(): Promise<PamUserFeedbackListPublicType> {
    const data = await this.feedbackService.listForCurrentUser();
    return pamUserFeedbackListPublicSchema.parse(data);
  }

  public async listAdminFeedback(): Promise<PamUserFeedbackAdminListType> {
    const data = await this.feedbackService.listAllForAdmin();
    return pamUserFeedbackAdminListSchema.parse(data);
  }

  public async updateAdminStatus(
    body: unknown
  ): Promise<PamUserFeedbackAdminStatusOkType> {
    const parsed = pamUserFeedbackAdminStatusPatchSchema.parse(body);
    const data = await this.feedbackService.updateStatusForAdmin(
      parsed.id,
      parsed.status
    );
    return pamUserFeedbackAdminStatusOkSchema.parse(data);
  }

  public async createAdminGithubIssue(
    body: unknown
  ): Promise<PamUserFeedbackAdminGithubIssueOkType> {
    const parsed = pamUserFeedbackAdminGithubIssueBodySchema.parse(body);
    const data = await this.feedbackService.createGithubIssueForAdmin(
      parsed.id
    );
    return pamUserFeedbackAdminGithubIssueOkSchema.parse(data);
  }

  public async attachScreenshots(
    feedbackId: string,
    files: readonly PamFeedbackScreenshotUploadType[]
  ): Promise<PamUserFeedbackScreenshotsOkType> {
    const data = await this.feedbackService.attachScreenshotsForCurrentUser(
      feedbackId,
      files
    );
    return pamUserFeedbackScreenshotsOkSchema.parse(data);
  }
}
