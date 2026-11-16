import { describe, expect, it, vi } from 'vitest';
import { FeedbackIssueSyncEngine } from '../src/feedback/FeedbackIssueSyncEngine';
import type { FeedbackIssueHostInterface } from '../src/feedback/FeedbackIssueHostInterface';
import type { FeedbackIssueScreenshotSyncEngine } from '../src/feedback/FeedbackIssueScreenshotSyncEngine';
import type { FeedbackIssueTemplateRenderer } from '../src/feedback/FeedbackIssueTemplateRenderer';
import type { FeedbackIssueTemplateResolver } from '../src/feedback/FeedbackIssueTemplateResolver';
import { FeedbackIssueSyncStatus } from '../src/feedback/types';
import type { GithubAppClient } from '../src/github/GithubAppClient';

function createHost(
  overrides: Partial<FeedbackIssueHostInterface> = {}
): FeedbackIssueHostInterface {
  return {
    resolveIssueContent: vi.fn(async () => ({
      issueNumber: 225,
      variables: { category: 'bug', summary: 'x' },
      labels: ['feedback']
    })),
    updateSync: vi.fn(async () => undefined),
    findScreenshotState: vi.fn(async () => null),
    compareAndSetScreenshotCount: vi.fn(async () => false),
    downloadScreenshot: vi.fn(async () => Buffer.from('')),
    formatScreenshotComment: vi.fn(() => ''),
    updateStatusByIssueNumber: vi.fn(async () => 0),
    resolveForgeAuth: vi.fn(async () => null),
    getFeedbackRepoFullName: vi.fn(async () => 'qlover/brain-toolkit'),
    ...overrides
  };
}

describe('FeedbackIssueSyncEngine', () => {
  it('已有 issueNumber 时仍调用 syncScreenshots', async () => {
    const host = createHost();
    const syncScreenshots = vi.fn(async () => 1);
    const screenshotSync = {
      syncScreenshots
    } as unknown as FeedbackIssueScreenshotSyncEngine;
    const engine = new FeedbackIssueSyncEngine({
      host,
      client: {} as GithubAppClient,
      templateResolver: {} as FeedbackIssueTemplateResolver,
      renderer: {} as FeedbackIssueTemplateRenderer,
      screenshotSync
    });

    const status = await engine.syncFeedback('fb-1');

    expect(status).toBe(FeedbackIssueSyncStatus.synced);
    expect(syncScreenshots).toHaveBeenCalledWith('fb-1', {});
    expect(host.resolveForgeAuth).not.toHaveBeenCalled();
  });
});
