import { randomUUID } from 'crypto';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { after } from 'next/server';
import { inject, injectable } from '@shared/container';
import {
  API_FEEDBACK_NOT_FOUND,
  API_FEEDBACK_SCREENSHOT_EMPTY,
  API_FEEDBACK_SCREENSHOT_TOO_LARGE,
  API_FEEDBACK_SCREENSHOT_TYPE_UNSUPPORTED,
  API_FEEDBACK_SCREENSHOTS_REQUIRED,
  API_FEEDBACK_SCREENSHOTS_TOO_MANY,
  API_NOT_AUTHORIZED
} from '@config/i18n-identifier/api';
import {
  PAM_FEEDBACK_SCREENSHOT_MAX_BYTES,
  PAM_FEEDBACK_SCREENSHOT_MAX_COUNT,
  type PamUserFeedbackAdminGithubIssueOkType,
  type PamUserFeedbackAdminListType,
  type PamUserFeedbackAdminStatusOkType,
  type PamUserFeedbackCreateBodyType,
  type PamUserFeedbackCreateOkType,
  type PamUserFeedbackListPublicType,
  type PamUserFeedbackScreenshotsOkType,
  type PamUserFeedbackStatusType
} from '@schemas/PamUserFeedbackSchema';
import { PamUserFeedbackRepo } from '@server/repositorys/PamUserFeedbackRepo';
import { PamGithubFeedbackIssueBundle } from '@server/services/feedback-github/PamGithubFeedbackIssueBundle';
import { OAuthUserService } from '@server/services/OAuthUserService';

export type PamFeedbackScreenshotUploadType = {
  readonly bytes: Buffer;
  readonly contentType: string;
  readonly fileName: string;
};

/**
 * 用户反馈业务编排：落库、截图、异步同步 GitHub Issue。
 */
@injectable()
export class PamUserFeedbackService {
  constructor(
    @inject(PamUserFeedbackRepo)
    protected readonly feedbackRepo: PamUserFeedbackRepo,
    @inject(OAuthUserService)
    protected readonly oauthUserService: OAuthUserService,
    @inject(PamGithubFeedbackIssueBundle)
    protected readonly issueBundle: PamGithubFeedbackIssueBundle
  ) {}

  public async createForCurrentUser(
    body: PamUserFeedbackCreateBodyType,
    meta: { readonly userAgent: string | null }
  ): Promise<PamUserFeedbackCreateOkType> {
    const userId = await this.requireUserId();
    const item = await this.feedbackRepo.insertForUser(userId, {
      category: body.category,
      body: body.body,
      pageUrl: body.pageUrl?.trim() ? body.pageUrl.trim() : null,
      userAgent: meta.userAgent,
      clientContext: body.clientContext ?? null
    });
    after(() => {
      void this.issueBundle.sync.syncFeedback(item.id);
    });
    return { ok: true, item };
  }

  public async listForCurrentUser(): Promise<PamUserFeedbackListPublicType> {
    const userId = await this.requireUserId();
    const items = await this.feedbackRepo.listForUser(userId);
    return { items };
  }

  public async listAllForAdmin(): Promise<PamUserFeedbackAdminListType> {
    const items = await this.feedbackRepo.listAllForAdmin(100);
    return { items };
  }

  public async updateStatusForAdmin(
    feedbackId: string,
    status: PamUserFeedbackStatusType
  ): Promise<PamUserFeedbackAdminStatusOkType> {
    const saved = await this.feedbackRepo.updateStatusAsAdmin(
      feedbackId,
      status
    );
    if (saved === null) {
      throw new ExecutorError(API_FEEDBACK_NOT_FOUND);
    }
    return { ok: true, id: feedbackId, status: saved };
  }

  public async createGithubIssueForAdmin(
    feedbackId: string
  ): Promise<PamUserFeedbackAdminGithubIssueOkType> {
    await this.issueBundle.sync.syncFeedback(feedbackId, { manual: true });
    const item = await this.feedbackRepo.findByIdAsAdmin(feedbackId);
    if (!item) {
      throw new ExecutorError(API_FEEDBACK_NOT_FOUND);
    }
    return {
      ok: true,
      id: item.id,
      githubSyncStatus: item.githubSyncStatus,
      githubIssueNumber: item.githubIssueNumber,
      githubIssueUrl: item.githubIssueUrl,
      githubSyncError: item.githubSyncError
    };
  }

  public async attachScreenshotsForCurrentUser(
    feedbackId: string,
    files: readonly PamFeedbackScreenshotUploadType[]
  ): Promise<PamUserFeedbackScreenshotsOkType> {
    if (files.length === 0) {
      throw new ExecutorError(API_FEEDBACK_SCREENSHOTS_REQUIRED);
    }
    if (files.length > PAM_FEEDBACK_SCREENSHOT_MAX_COUNT) {
      throw new ExecutorError(API_FEEDBACK_SCREENSHOTS_TOO_MANY);
    }
    const userId = await this.requireUserId();
    const ownedId = await this.feedbackRepo.findOwnedId(feedbackId, userId);
    if (ownedId === null) {
      throw new ExecutorError(API_FEEDBACK_NOT_FOUND);
    }
    const paths: string[] = [];
    for (const [index, file] of files.entries()) {
      if (file.bytes.byteLength === 0) {
        throw new ExecutorError(API_FEEDBACK_SCREENSHOT_EMPTY);
      }
      if (file.bytes.byteLength > PAM_FEEDBACK_SCREENSHOT_MAX_BYTES) {
        throw new ExecutorError(API_FEEDBACK_SCREENSHOT_TOO_LARGE);
      }
      if (!isAllowedImageType(file.contentType)) {
        throw new ExecutorError(API_FEEDBACK_SCREENSHOT_TYPE_UNSUPPORTED);
      }
      const ext = extensionForContentType(file.contentType);
      const objectPath = `${userId}/${feedbackId}/${randomUUID()}-${String(index)}.${ext}`;
      await this.feedbackRepo.uploadScreenshotObject(
        objectPath,
        file.bytes,
        file.contentType.startsWith('image/') ? file.contentType : 'image/jpeg'
      );
      paths.push(objectPath);
    }
    const saved = await this.feedbackRepo.updateScreenshotPaths(
      feedbackId,
      userId,
      paths
    );
    after(() => {
      void this.issueBundle.screenshots.syncScreenshots(feedbackId);
    });
    return { ok: true, screenshotPaths: [...saved] };
  }

  protected async requireUserId(): Promise<string> {
    const user = await this.oauthUserService.getSessionUser();
    if (!user?.id) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'Not authorized');
    }
    return user.id;
  }
}

function isAllowedImageType(contentType: string): boolean {
  return (
    contentType === 'image/jpeg' ||
    contentType === 'image/png' ||
    contentType === 'image/webp' ||
    contentType === 'image/jpg'
  );
}

function extensionForContentType(contentType: string): string {
  if (contentType === 'image/png') {
    return 'png';
  }
  if (contentType === 'image/webp') {
    return 'webp';
  }
  return 'jpg';
}
