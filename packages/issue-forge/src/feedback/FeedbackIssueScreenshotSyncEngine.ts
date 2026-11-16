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
import {
  FeedbackIssueSyncStatus,
  type FeedbackIssueLoggerInterface,
  type FeedbackIssueSyncOptionsType,
  type FeedbackScreenshotSyncStateType
} from './types';

/** Issue 尚未落库时短重试间隔（毫秒） */
const ISSUE_NUMBER_RETRY_DELAYS_MS: readonly number[] = [
  200, 400, 800, 800, 800
];

const SCREENSHOT_ERROR_PREFIX = 'screenshot: ';

export type FeedbackIssueScreenshotSyncEngineOptionsType = {
  readonly host: FeedbackIssueHostInterface;
  readonly client: GithubAppClient;
  readonly logger?: FeedbackIssueLoggerInterface;
  /** 测试可注入，避免真实 sleep */
  readonly sleep?: (ms: number) => Promise<void>;
};

/**
 * 截图上传到 assets 分支并以评论挂到 Issue（评论正文由 Host 决定）。
 */
export class FeedbackIssueScreenshotSyncEngine {
  protected readonly host: FeedbackIssueHostInterface;
  protected readonly client: GithubAppClient;
  protected readonly logger: FeedbackIssueLoggerInterface | undefined;
  protected readonly sleep: (ms: number) => Promise<void>;

  constructor(options: FeedbackIssueScreenshotSyncEngineOptionsType) {
    this.host = options.host;
    this.client = options.client;
    this.logger = options.logger;
    this.sleep =
      options.sleep ??
      ((ms: number): Promise<void> =>
        new Promise((resolve) => {
          setTimeout(resolve, ms);
        }));
  }

  public async syncScreenshots(
    feedbackId: string,
    options: FeedbackIssueSyncOptionsType = {}
  ): Promise<number> {
    let state = await this.host.findScreenshotState(feedbackId);
    if (!state || state.paths.length <= state.postedCount) {
      return 0;
    }
    if (state.issueNumber === null) {
      state = await this.waitForIssueNumber(feedbackId, state);
      if (
        !state ||
        state.issueNumber === null ||
        state.paths.length <= state.postedCount
      ) {
        this.logger?.warn('feedback screenshot sync skipped: issue not ready', {
          feedbackId
        });
        return 0;
      }
    }

    const auth = await this.host.resolveForgeAuth(options);
    if (!auth) {
      return 0;
    }

    const issueNumber = state.issueNumber;
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
        { issueNumber },
        this.host.formatScreenshotComment(urls, from)
      );
      await this.host.updateSync(feedbackId, {
        status: FeedbackIssueSyncStatus.synced,
        issueNumber,
        issueUrl: state.issueUrl,
        error: null
      });
      return urls.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger?.error('feedback screenshot sync failed', {
        feedbackId,
        message
      });
      await this.host
        .compareAndSetScreenshotCount(feedbackId, to, from)
        .catch(() => false);
      await this.host
        .updateSync(feedbackId, {
          status: FeedbackIssueSyncStatus.synced,
          issueNumber,
          issueUrl: state.issueUrl,
          error: `${SCREENSHOT_ERROR_PREFIX}${message}`
        })
        .catch(() => undefined);
      return 0;
    }
  }

  /**
   * 私有仓 Issue Markdown 可渲染的 raw URL（同源 cookie，避免 raw.githubusercontent.com）。
   */
  public static buildRawAssetUrl(
    auth: Pick<GithubAppAuthConfigType, 'owner' | 'repo'>,
    branch: string,
    path: string
  ): string {
    const encodedPath = path
      .split('/')
      .filter((segment) => segment.length > 0)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `https://github.com/${encodeURIComponent(auth.owner)}/${encodeURIComponent(auth.repo)}/raw/${encodeURIComponent(branch)}/${encodedPath}`;
  }

  protected async waitForIssueNumber(
    feedbackId: string,
    initial: FeedbackScreenshotSyncStateType
  ): Promise<FeedbackScreenshotSyncStateType | null> {
    let latest: FeedbackScreenshotSyncStateType | null = initial;
    for (const delayMs of ISSUE_NUMBER_RETRY_DELAYS_MS) {
      await this.sleep(delayMs);
      latest = await this.host.findScreenshotState(feedbackId);
      if (latest?.issueNumber !== null && latest?.issueNumber !== undefined) {
        return latest;
      }
    }
    return latest;
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
      const repoPath = `${FEEDBACK_ISSUE_ASSETS_DIR}/${feedbackId}/${fileName}`;
      await content.uploadFile({
        branch: FEEDBACK_ISSUE_ASSETS_BRANCH,
        path: repoPath,
        contentBase64: bytes.toString('base64'),
        message: `chore(feedback): feedback ${feedbackId} screenshot`
      });
      urls.push(
        FeedbackIssueScreenshotSyncEngine.buildRawAssetUrl(
          auth,
          FEEDBACK_ISSUE_ASSETS_BRANCH,
          repoPath
        )
      );
    }
    return urls;
  }
}
