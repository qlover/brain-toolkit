import type { GithubAppClient } from '../github/GithubAppClient';
import type { IssueForgeTokenCacheInterface } from '../types/IssueForgeTypes';
import type { FeedbackIssueHostInterface } from './FeedbackIssueHostInterface';
import { FeedbackIssueScreenshotSyncEngine } from './FeedbackIssueScreenshotSyncEngine';
import { FeedbackIssueStatusSyncEngine } from './FeedbackIssueStatusSyncEngine';
import { FeedbackIssueSyncEngine } from './FeedbackIssueSyncEngine';
import { FeedbackIssueTemplateRenderer } from './FeedbackIssueTemplateRenderer';
import { FeedbackIssueTemplateResolver } from './FeedbackIssueTemplateResolver';
import type { FeedbackIssueLoggerInterface } from './types';

export type CreateGithubFeedbackIssueBundleOptionsType = {
  readonly host: FeedbackIssueHostInterface;
  readonly client: GithubAppClient;
  readonly cache: IssueForgeTokenCacheInterface;
  readonly logger?: FeedbackIssueLoggerInterface;
  readonly defaultTemplate?: string;
};

export type GithubFeedbackIssueBundleType = {
  readonly sync: FeedbackIssueSyncEngine;
  readonly screenshots: FeedbackIssueScreenshotSyncEngine;
  readonly status: FeedbackIssueStatusSyncEngine;
  readonly renderer: FeedbackIssueTemplateRenderer;
  readonly templateResolver: FeedbackIssueTemplateResolver;
};

/**
 * 组装 GitHub 反馈同步基本实现（形态 B：依赖注入由应用完成）。
 */
export function createGithubFeedbackIssueBundle(
  options: CreateGithubFeedbackIssueBundleOptionsType
): GithubFeedbackIssueBundleType {
  const renderer = new FeedbackIssueTemplateRenderer();
  const templateResolver = new FeedbackIssueTemplateResolver({
    client: options.client,
    cache: options.cache,
    logger: options.logger,
    defaultTemplate: options.defaultTemplate
  });
  const screenshots = new FeedbackIssueScreenshotSyncEngine({
    host: options.host,
    client: options.client,
    logger: options.logger
  });
  const sync = new FeedbackIssueSyncEngine({
    host: options.host,
    client: options.client,
    templateResolver,
    renderer,
    screenshotSync: screenshots,
    logger: options.logger
  });
  const status = new FeedbackIssueStatusSyncEngine({
    host: options.host,
    logger: options.logger
  });
  return {
    sync,
    screenshots,
    status,
    renderer,
    templateResolver
  };
}
