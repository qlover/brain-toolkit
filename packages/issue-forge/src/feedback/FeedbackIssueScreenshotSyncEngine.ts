import type { GithubAppClient } from '../github/GithubAppClient';
import {
  createGithubAppIssueForge,
  createGithubAppRepoContent
} from '../github/createGithubAppForge';
import type { GithubAppAuthConfigType } from '../types/IssueForgeTypes';
import type { FeedbackIssueHostInterface } from './FeedbackIssueHostInterface';
import {
  FEEDBACK_ISSUE_ASSETS_BRANCH,
  FEEDBACK_ISSUE_ASSETS_DIR,
  FEEDBACK_ISSUE_ASSETS_README
} from './FeedbackIssueTemplateConfig';
import type {
  FeedbackIssueLoggerInterface,
  FeedbackIssueSyncOptionsType
} from './types';

export type FeedbackIssueScreenshotSyncEngineOptionsType = {
  readonly host: FeedbackIssueHostInterface;
  readonly client: GithubAppClient;
  readonly logger?: FeedbackIssueLoggerInterface;
};

/**
 * 截图上传到 assets 分支并以评论挂到 Issue（评论正文由 Host 决定）。
 */
export class FeedbackIssueScreenshotSyncEngine {
  protected readonly host: FeedbackIssueHostInterface;
  protected readonly client: GithubAppClient;
  protected readonly logger: FeedbackIssueLoggerInterface | undefined;

  constructor(options: FeedbackIssueScreenshotSyncEngineOptionsType) {
    this.host = options.host;
    this.client = options.client;
    this.logger = options.logger;
  }

  public async syncScreenshots(
    feedbackId: string,
    options: FeedbackIssueSyncOptionsType = {}
  ): Promise<number> {
    const state = await this.host.findScreenshotState(feedbackId);
    if (
      !state ||
      state.issueNumber === null ||
      state.paths.length <= state.postedCount
    ) {
      return 0;
    }
    const auth = await this.host.resolveForgeAuth(options);
    if (!auth) {
      return 0;
    }

    const from = state.postedCount;
    const to = state.paths.length;
    const claimed = await this.host.compareAndSetScreenshotCount(
      feedbackId,
      from,
      to
    );
    if (!claimed) {
      return 0;
    }

    try {
      const urls = await this.uploadScreenshots(
        auth,
        feedbackId,
        state.paths.slice(from)
      );
      const forge = createGithubAppIssueForge(this.client, auth);
      await forge.createComment(
        { issueNumber: state.issueNumber },
        this.host.formatScreenshotComment(urls, from)
      );
      return urls.length;
    } catch (error) {
      this.logger?.error('feedback screenshot sync failed', {
        feedbackId,
        message: error instanceof Error ? error.message : String(error)
      });
      await this.host
        .compareAndSetScreenshotCount(feedbackId, to, from)
        .catch(() => false);
      return 0;
    }
  }

  protected async uploadScreenshots(
    auth: GithubAppAuthConfigType,
    feedbackId: string,
    objectPaths: readonly string[]
  ): Promise<string[]> {
    const content = createGithubAppRepoContent(this.client, auth);
    await content.ensureBranch(FEEDBACK_ISSUE_ASSETS_BRANCH, {
      path: 'README.md',
      content: FEEDBACK_ISSUE_ASSETS_README
    });
    const urls: string[] = [];
    for (const [index, objectPath] of objectPaths.entries()) {
      const bytes = await this.host.downloadScreenshot(objectPath);
      const fileName = objectPath.split('/').pop() || `${String(index)}.jpg`;
      const uploaded = await content.uploadFile({
        branch: FEEDBACK_ISSUE_ASSETS_BRANCH,
        path: `${FEEDBACK_ISSUE_ASSETS_DIR}/${feedbackId}/${fileName}`,
        contentBase64: bytes.toString('base64'),
        message: `chore(feedback): feedback ${feedbackId} screenshot`
      });
      urls.push(`${uploaded.url}?raw=true`);
    }
    return urls;
  }
}
