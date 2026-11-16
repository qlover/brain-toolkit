import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedbackIssueHostInterface } from '../src/feedback/FeedbackIssueHostInterface';
import { FeedbackIssueScreenshotSyncEngine } from '../src/feedback/FeedbackIssueScreenshotSyncEngine';
import {
  FEEDBACK_ISSUE_ASSETS_BRANCH,
  FEEDBACK_ISSUE_ASSETS_DIR
} from '../src/feedback/FeedbackIssueTemplateConfig';
import { FeedbackIssueSyncStatus } from '../src/feedback/types';
import type { GithubAppClient } from '../src/github/GithubAppClient';

const createComment = vi.fn(async () => undefined);
const ensureBranch = vi.fn(async () => undefined);
const uploadFile = vi.fn(async () => ({
  url: 'https://github.com/qlover/brain-toolkit/blob/feedback-assets/x.jpg'
}));

vi.mock('../src/github/createGithubAppForge', () => ({
  createGithubAppIssueForge: vi.fn(() => ({
    createComment
  })),
  createGithubAppRepoContent: vi.fn(() => ({
    ensureBranch,
    uploadFile
  }))
}));

const AUTH = {
  appId: '1',
  installationId: '2',
  privateKey: 'k',
  owner: 'qlover',
  repo: 'brain-toolkit'
} as const;

function createHost(
  overrides: Partial<FeedbackIssueHostInterface> = {}
): FeedbackIssueHostInterface {
  return {
    resolveIssueContent: vi.fn(async () => null),
    updateSync: vi.fn(async () => undefined),
    findScreenshotState: vi.fn(async () => ({
      issueNumber: 225,
      issueUrl: 'https://github.com/qlover/brain-toolkit/issues/225',
      paths: ['u/f/a.jpg'],
      postedCount: 0
    })),
    compareAndSetScreenshotCount: vi.fn(async () => true),
    downloadScreenshot: vi.fn(async () => Buffer.from('img')),
    formatScreenshotComment: vi.fn((urls: readonly string[]) =>
      urls.map((url) => `![x](${url})`).join('\n')
    ),
    updateStatusByIssueNumber: vi.fn(async () => 0),
    resolveForgeAuth: vi.fn(async () => AUTH),
    getFeedbackRepoFullName: vi.fn(async () => 'qlover/brain-toolkit'),
    ...overrides
  };
}

describe('FeedbackIssueScreenshotSyncEngine', () => {
  beforeEach(() => {
    createComment.mockClear();
    ensureBranch.mockClear();
    uploadFile.mockClear();
  });

  it('buildRawAssetUrl 使用 /raw/{branch}/path', () => {
    const url = FeedbackIssueScreenshotSyncEngine.buildRawAssetUrl(
      AUTH,
      FEEDBACK_ISSUE_ASSETS_BRANCH,
      `${FEEDBACK_ISSUE_ASSETS_DIR}/fb/a.jpg`
    );
    expect(url).toBe(
      'https://github.com/qlover/brain-toolkit/raw/feedback-assets/feedback/fb/a.jpg'
    );
  });

  it('issueNumber 稍后出现时重试后成功评论', async () => {
    let calls = 0;
    const host = createHost({
      findScreenshotState: vi.fn(async () => {
        calls += 1;
        if (calls < 3) {
          return {
            issueNumber: null,
            issueUrl: null,
            paths: ['u/f/a.jpg'],
            postedCount: 0
          };
        }
        return {
          issueNumber: 225,
          issueUrl: 'https://github.com/qlover/brain-toolkit/issues/225',
          paths: ['u/f/a.jpg'],
          postedCount: 0
        };
      })
    });
    const engine = new FeedbackIssueScreenshotSyncEngine({
      host,
      client: {} as GithubAppClient,
      sleep: async () => undefined
    });

    const posted = await engine.syncScreenshots('fb-1');

    expect(posted).toBe(1);
    expect(createComment).toHaveBeenCalledTimes(1);
    const commentBody = createComment.mock.calls[0]?.[1] as string;
    expect(commentBody).toContain(
      '/raw/feedback-assets/feedback/fb-1/a.jpg'
    );
    expect(host.updateSync).toHaveBeenCalledWith(
      'fb-1',
      expect.objectContaining({
        status: FeedbackIssueSyncStatus.synced,
        error: null
      })
    );
  });

  it('上传失败时回滚 count 并写入 screenshot 错误', async () => {
    uploadFile.mockRejectedValueOnce(new Error('upload boom'));
    const host = createHost();
    const engine = new FeedbackIssueScreenshotSyncEngine({
      host,
      client: {} as GithubAppClient,
      sleep: async () => undefined
    });

    const posted = await engine.syncScreenshots('fb-1');

    expect(posted).toBe(0);
    expect(host.compareAndSetScreenshotCount).toHaveBeenCalledWith(
      'fb-1',
      1,
      0
    );
    expect(host.updateSync).toHaveBeenCalledWith(
      'fb-1',
      expect.objectContaining({
        issueNumber: 225,
        error: 'screenshot: upload boom'
      })
    );
  });
});
