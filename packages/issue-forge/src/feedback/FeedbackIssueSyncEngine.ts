import type { GithubAppClient } from '../github/GithubAppClient';
import { createGithubAppIssueForge } from '../github/createGithubAppForge';
import type { FeedbackIssueHostInterface } from './FeedbackIssueHostInterface';
import type { FeedbackIssueScreenshotSyncEngine } from './FeedbackIssueScreenshotSyncEngine';
import type { FeedbackIssueTemplateRenderer } from './FeedbackIssueTemplateRenderer';
import type { FeedbackIssueTemplateResolver } from './FeedbackIssueTemplateResolver';
import {
  FeedbackIssueSyncStatus,
  type FeedbackIssueLoggerInterface,
  type FeedbackIssueSyncOptionsType,
  type FeedbackIssueSyncStatusType
} from './types';

export type FeedbackIssueSyncEngineOptionsType = {
  readonly host: FeedbackIssueHostInterface;
  readonly client: GithubAppClient;
  readonly templateResolver: FeedbackIssueTemplateResolver;
  readonly renderer: FeedbackIssueTemplateRenderer;
  readonly screenshotSync: FeedbackIssueScreenshotSyncEngine;
  readonly logger?: FeedbackIssueLoggerInterface;
};

/**
 * 单条反馈 → Forge Issue 同步（模板 + Host 提供的变量）。
 */
export class FeedbackIssueSyncEngine {
  protected readonly host: FeedbackIssueHostInterface;
  protected readonly client: GithubAppClient;
  protected readonly templateResolver: FeedbackIssueTemplateResolver;
  protected readonly renderer: FeedbackIssueTemplateRenderer;
  protected readonly screenshotSync: FeedbackIssueScreenshotSyncEngine;
  protected readonly logger: FeedbackIssueLoggerInterface | undefined;

  constructor(options: FeedbackIssueSyncEngineOptionsType) {
    this.host = options.host;
    this.client = options.client;
    this.templateResolver = options.templateResolver;
    this.renderer = options.renderer;
    this.screenshotSync = options.screenshotSync;
    this.logger = options.logger;
  }

  public async syncFeedback(
    feedbackId: string,
    options: FeedbackIssueSyncOptionsType = {}
  ): Promise<FeedbackIssueSyncStatusType> {
    const content = await this.host.resolveIssueContent(feedbackId);
    if (!content) {
      return FeedbackIssueSyncStatus.skipped;
    }
    if (content.issueNumber !== null) {
      return FeedbackIssueSyncStatus.synced;
    }

    const auth = await this.host.resolveForgeAuth(options);
    if (!auth) {
      await this.host.updateSync(feedbackId, {
        status: FeedbackIssueSyncStatus.skipped,
        issueNumber: null,
        issueUrl: null,
        error: null
      });
      return FeedbackIssueSyncStatus.skipped;
    }

    try {
      const template = await this.templateResolver.resolve(auth);
      const forge = createGithubAppIssueForge(this.client, auth);
      const created = await forge.createIssue(
        this.renderer.buildIssue(
          template,
          content.variables,
          content.labels ?? []
        )
      );
      await this.host.updateSync(feedbackId, {
        status: FeedbackIssueSyncStatus.synced,
        issueNumber: created.issueNumber,
        issueUrl: created.issueUrl,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger?.error('feedback github sync failed', {
        feedbackId,
        message
      });
      await this.host.updateSync(feedbackId, {
        status: FeedbackIssueSyncStatus.failed,
        issueNumber: null,
        issueUrl: null,
        error: message
      });
      return FeedbackIssueSyncStatus.failed;
    }

    await this.screenshotSync.syncScreenshots(feedbackId, options);
    return FeedbackIssueSyncStatus.synced;
  }
}
