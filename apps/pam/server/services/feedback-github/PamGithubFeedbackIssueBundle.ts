import {
  createGithubWebhookVerifier,
  type GithubAppAuthConfigType,
  type IssueWebhookVerifierInterface,
  type IssueWebhookVerifyResultType
} from '@brain-toolkit/issue-forge';
import {
  createGithubFeedbackIssueBundle,
  type FeedbackIssueContentResolveType,
  type FeedbackIssueHostInterface,
  type FeedbackIssueScreenshotSyncEngine,
  type FeedbackIssueStatusSyncEngine,
  type FeedbackIssueStatusType,
  type FeedbackIssueSyncEngine,
  type FeedbackIssueSyncFieldsType,
  type FeedbackIssueSyncOptionsType,
  type FeedbackScreenshotSyncStateType,
  type GithubFeedbackIssueBundleType
} from '@brain-toolkit/issue-forge/feedback';
import { MemoryKvCacheService } from '@brain-toolkit/next-app-kit/server';
import { inject, injectable } from '@shared/container';
import { toBusinessEmail } from '@shared/utils/pamUserIdentity';
import { I } from '@config/ioc-identifiter';
import { PAM_SITE_SETTING_KEYS } from '@config/pamSiteSettings';
import type {
  PamFeedbackClientContextType,
  PamUserFeedbackAdminItemType,
  PamUserFeedbackStatusType
} from '@schemas/PamUserFeedbackSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { PamGithubAppClient } from '@server/adapters/PamGithubAppClient';
import { PamUserFeedbackRepo } from '@server/repositorys/PamUserFeedbackRepo';
import { PamUsersRepo } from '@server/repositorys/PamUsersRepo';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import type { LoggerInterface } from '@qlover/logger';

const REPO_PATTERN = /^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/;
const NUMERIC_ID_PATTERN = /^\d+$/;
const DEFAULT_FEEDBACK_REPO = 'qlover/brain-toolkit';
const EMPTY = '-';
const ADMIN_PATH = '/zh/admin/feedback';

const PAM_FEEDBACK_ISSUE_DEFAULT_TEMPLATE = `---
name: 用户反馈
about: PAM 用户反馈（后台自动创建 Issue 也使用本模板，占位符由服务端替换）
title: "[反馈][{{category}}] {{summary}}"
labels: feedback
---

> 来自 PAM 用户反馈 · 反馈 ID：\`{{feedback_id}}\` · [后台查看]({{admin_url}})

### 提交人

| 项目 | 值 |
| --- | --- |
| 昵称 | {{display_name}} |
| 邮箱 | {{email}} |
| 手机 | {{phone}} |
| 提交时间 | {{created_at}} |

### 描述

{{body}}

### 设备与环境

{{environment}}

### 页面

{{page_url}}

### 截图

如有截图，会以评论形式追加在下方。

{{user_agent}}
` as const;

type GithubFeedbackRawConfigType = {
  readonly appId: string;
  readonly installationId: string;
  readonly privateKey: string;
  readonly repo: string;
};

/**
 * PAM 反馈→Issue 唯一 DI 入口：Host（含模板变量）+ 模板 + webhook 验签。
 */
@injectable()
export class PamGithubFeedbackIssueBundle
  implements IssueWebhookVerifierInterface
{
  public readonly sync: FeedbackIssueSyncEngine;
  public readonly screenshots: FeedbackIssueScreenshotSyncEngine;
  public readonly status: FeedbackIssueStatusSyncEngine;

  constructor(
    @inject(PamUserFeedbackRepo)
    feedbackRepo: PamUserFeedbackRepo,
    @inject(PamUsersRepo)
    pamUsersRepo: PamUsersRepo,
    @inject(SiteSettingsService)
    protected readonly siteSettings: SiteSettingsService,
    @inject(PamGithubAppClient)
    githubClient: PamGithubAppClient,
    @inject(MemoryKvCacheService)
    cache: MemoryKvCacheService,
    @inject(I.AppConfig)
    serverConfig: SeedServerConfigInterface,
    @inject(I.Logger)
    logger: LoggerInterface
  ) {
    const bundle: GithubFeedbackIssueBundleType =
      createGithubFeedbackIssueBundle({
        host: new PamFeedbackIssueHost(
          feedbackRepo,
          pamUsersRepo,
          siteSettings,
          serverConfig.siteUrl
        ),
        client: githubClient.client,
        cache,
        logger,
        defaultTemplate: PAM_FEEDBACK_ISSUE_DEFAULT_TEMPLATE
      });
    this.sync = bundle.sync;
    this.screenshots = bundle.screenshots;
    this.status = bundle.status;
  }

  /**
   * @override
   */
  public async verify(
    rawBody: string,
    signatureHeader: string | null
  ): Promise<IssueWebhookVerifyResultType> {
    const secret = (
      await this.siteSettings.getSecretString(
        PAM_SITE_SETTING_KEYS.GITHUB_WEBHOOK_SECRET
      )
    ).trim();
    return createGithubWebhookVerifier(secret).verify(rawBody, signatureHeader);
  }
}

class PamFeedbackIssueHost implements FeedbackIssueHostInterface {
  constructor(
    protected readonly feedbackRepo: PamUserFeedbackRepo,
    protected readonly pamUsersRepo: PamUsersRepo,
    protected readonly siteSettings: SiteSettingsService,
    protected readonly siteUrl: string
  ) {}

  /**
   * @override
   */
  public async resolveIssueContent(
    feedbackId: string
  ): Promise<FeedbackIssueContentResolveType | null> {
    const item = await this.feedbackRepo.findByIdAsAdmin(feedbackId);
    if (!item) {
      return null;
    }
    const contact = await this.resolveContact(item.userId);
    return {
      issueNumber: item.githubIssueNumber,
      variables: this.buildVariables(item, contact),
      labels: [`type:${item.category}`]
    };
  }

  /**
   * @override
   */
  public async updateSync(
    feedbackId: string,
    fields: FeedbackIssueSyncFieldsType
  ): Promise<void> {
    await this.feedbackRepo.updateGithubSyncAsAdmin(feedbackId, fields);
  }

  /**
   * @override
   */
  public async findScreenshotState(
    feedbackId: string
  ): Promise<FeedbackScreenshotSyncStateType | null> {
    return this.feedbackRepo.findScreenshotSyncStateAsAdmin(feedbackId);
  }

  /**
   * @override
   */
  public async compareAndSetScreenshotCount(
    feedbackId: string,
    from: number,
    to: number
  ): Promise<boolean> {
    return this.feedbackRepo.compareAndSetScreenshotCountAsAdmin(
      feedbackId,
      from,
      to
    );
  }

  /**
   * @override
   */
  public async downloadScreenshot(objectPath: string): Promise<Buffer> {
    return this.feedbackRepo.downloadScreenshotObject(objectPath);
  }

  /**
   * @override
   */
  public formatScreenshotComment(
    imageUrls: readonly string[],
    startIndex: number
  ): string {
    const lines = imageUrls.map((url, i) => {
      const n = startIndex + i + 1;
      return `![截图 ${String(n)}](${url})`;
    });
    return ['### 截图', '', ...lines].join('\n');
  }

  /**
   * @override
   */
  public async updateStatusByIssueNumber(
    issueNumber: number,
    status: FeedbackIssueStatusType
  ): Promise<number> {
    return this.feedbackRepo.updateStatusByIssueNumberAsAdmin(
      issueNumber,
      status as PamUserFeedbackStatusType
    );
  }

  /**
   * @override
   */
  public async resolveForgeAuth(
    options: FeedbackIssueSyncOptionsType = {}
  ): Promise<GithubAppAuthConfigType | null> {
    if (!options.manual) {
      const enabled = await this.siteSettings.getBoolean(
        PAM_SITE_SETTING_KEYS.GITHUB_FEEDBACK_SYNC_ENABLED
      );
      if (!enabled) {
        return null;
      }
    }

    const raw = await this.readRaw();
    const repoMatch = REPO_PATTERN.exec(raw.repo);
    if (!this.isRawValid(raw) || !repoMatch) {
      return null;
    }

    return {
      appId: raw.appId,
      installationId: raw.installationId,
      privateKey: raw.privateKey,
      owner: repoMatch[1] ?? '',
      repo: repoMatch[2] ?? ''
    };
  }

  /**
   * @override
   */
  public async getFeedbackRepoFullName(): Promise<string> {
    const configured = await this.siteSettings.getString(
      PAM_SITE_SETTING_KEYS.GITHUB_FEEDBACK_REPO
    );
    return configured.trim() || DEFAULT_FEEDBACK_REPO;
  }

  protected buildVariables(
    item: PamUserFeedbackAdminItemType,
    contact: { readonly email: string | null; readonly phone: string | null }
  ): Record<string, string> {
    const summary = Array.from(item.body.replace(/\s+/g, ' ').trim())
      .slice(0, 60)
      .join('');
    const root = this.siteUrl.replace(/\/$/, '');
    return {
      feedback_id: item.id,
      category: item.category,
      summary: summary || item.category,
      display_name: item.displayName.trim() || EMPTY,
      email: contact.email ?? EMPTY,
      phone: contact.phone ?? EMPTY,
      created_at: item.createdAt,
      body: this.sanitizeMentions(item.body),
      environment: this.formatEnvironment(item.clientContext),
      page_url: item.pageUrl?.trim() || EMPTY,
      user_agent: item.userAgent
        ? `\`${this.sanitizeMentions(item.userAgent)}\``
        : '',
      admin_url: root ? `${root}${ADMIN_PATH}` : ADMIN_PATH
    };
  }

  protected formatEnvironment(
    ctx: PamFeedbackClientContextType | null
  ): string {
    if (!ctx) {
      return EMPTY;
    }
    const device = ctx.device;
    const lines: string[] = [];
    if (device) {
      lines.push(
        `- kind: ${device.kind}`,
        `- runtime: ${device.runtime}`,
        `- os: ${`${device.osName} ${device.osVersion}`.trim()}`,
        `- browser: ${`${device.browserName} ${device.browserVersion}`.trim()}`
      );
      if (device.hostApp) {
        lines.push(`- host: ${device.hostApp}`);
      }
      if (device.model) {
        lines.push(`- model: ${device.model}`);
      }
    }
    lines.push(
      `- language: ${ctx.language || EMPTY}`,
      `- time_zone: ${ctx.timeZone || EMPTY}`,
      `- viewport: ${String(ctx.window.viewport.width)}×${String(ctx.window.viewport.height)}`
    );
    return lines.join('\n');
  }

  protected async resolveContact(
    userId: string
  ): Promise<{ readonly email: string | null; readonly phone: string | null }> {
    try {
      const row = await this.pamUsersRepo.findById(userId);
      if (!row) {
        return { email: null, phone: null };
      }
      return {
        email: toBusinessEmail(row.email),
        phone: row.phone
          ? /^\d+$/.test(row.phone)
            ? `+${row.phone}`
            : row.phone
          : null
      };
    } catch {
      return { email: null, phone: null };
    }
  }

  protected sanitizeMentions(text: string): string {
    return text.replace(/@/g, '@\u200B');
  }

  protected async readRaw(): Promise<GithubFeedbackRawConfigType> {
    const [appId, installationId, privateKey, repo] = await Promise.all([
      this.siteSettings.getString(PAM_SITE_SETTING_KEYS.GITHUB_APP_ID),
      this.siteSettings.getString(
        PAM_SITE_SETTING_KEYS.GITHUB_APP_INSTALLATION_ID
      ),
      this.siteSettings.getSecretString(
        PAM_SITE_SETTING_KEYS.GITHUB_APP_PRIVATE_KEY
      ),
      this.siteSettings.getString(PAM_SITE_SETTING_KEYS.GITHUB_FEEDBACK_REPO)
    ]);
    return {
      appId: appId.trim(),
      installationId: installationId.trim(),
      privateKey,
      repo: repo.trim() || DEFAULT_FEEDBACK_REPO
    };
  }

  protected isRawValid(raw: GithubFeedbackRawConfigType): boolean {
    return (
      NUMERIC_ID_PATTERN.test(raw.appId) &&
      NUMERIC_ID_PATTERN.test(raw.installationId) &&
      raw.privateKey.includes('PRIVATE KEY') &&
      REPO_PATTERN.test(raw.repo)
    );
  }
}
