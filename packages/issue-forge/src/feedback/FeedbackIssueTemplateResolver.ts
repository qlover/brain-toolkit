import type { GithubAppClient } from '../github/GithubAppClient';
import { createGithubAppRepoContent } from '../github/createGithubAppForge';
import type {
  GithubAppAuthConfigType,
  IssueForgeTokenCacheInterface
} from '../types/IssueForgeTypes';
import {
  FEEDBACK_ISSUE_DEFAULT_TEMPLATE,
  FEEDBACK_ISSUE_TEMPLATE_CACHE_TTL_MS,
  FEEDBACK_ISSUE_TEMPLATE_FAILURE_TTL_MS,
  FEEDBACK_ISSUE_TEMPLATE_PATH,
  FeedbackIssueTemplateSource,
  type FeedbackIssueTemplateSourceType
} from './FeedbackIssueTemplateConfig';
import type { FeedbackIssueLoggerInterface } from './types';

export type FeedbackIssueTemplateType = {
  readonly title: string;
  readonly labels: readonly string[];
  readonly body: string;
  readonly source: FeedbackIssueTemplateSourceType;
};

type CachedTemplateType = {
  readonly raw: string | null;
};

type FrontMatterType = Readonly<Record<string, string | readonly string[]>>;

export type FeedbackIssueTemplateResolverOptionsType = {
  readonly client: GithubAppClient;
  readonly cache: IssueForgeTokenCacheInterface;
  readonly logger?: FeedbackIssueLoggerInterface;
  readonly defaultTemplate?: string;
};

/**
 * 读取仓库反馈 Issue 模板；失败时回退内置模板。
 */
export class FeedbackIssueTemplateResolver {
  protected readonly client: GithubAppClient;
  protected readonly cache: IssueForgeTokenCacheInterface;
  protected readonly logger: FeedbackIssueLoggerInterface | undefined;
  protected readonly defaultTemplate: string;

  constructor(options: FeedbackIssueTemplateResolverOptionsType) {
    this.client = options.client;
    this.cache = options.cache;
    this.logger = options.logger;
    this.defaultTemplate =
      options.defaultTemplate ?? FEEDBACK_ISSUE_DEFAULT_TEMPLATE;
  }

  public async resolve(
    config: GithubAppAuthConfigType
  ): Promise<FeedbackIssueTemplateType> {
    const raw = await this.loadRaw(config);
    if (raw) {
      const template = this.parse(raw, FeedbackIssueTemplateSource.repo);
      if (template.body) {
        return template;
      }
    }
    return this.parse(
      this.defaultTemplate,
      FeedbackIssueTemplateSource.builtin
    );
  }

  protected async loadRaw(
    config: GithubAppAuthConfigType
  ): Promise<string | null> {
    const cacheKey = `issue-forge:feedback:issue-template:${config.owner}/${config.repo}`;
    const cached = await this.cache.getItem<CachedTemplateType>(cacheKey);
    if (cached) {
      return cached.raw;
    }
    try {
      const content = createGithubAppRepoContent(this.client, config);
      const raw = await content.readTextFile(FEEDBACK_ISSUE_TEMPLATE_PATH);
      await this.cache.setItem<CachedTemplateType>(
        cacheKey,
        { raw },
        { ttlMs: FEEDBACK_ISSUE_TEMPLATE_CACHE_TTL_MS }
      );
      return raw;
    } catch (error) {
      this.logger?.warn('feedback issue template load failed', {
        message: error instanceof Error ? error.message : String(error)
      });
      await this.cache.setItem<CachedTemplateType>(
        cacheKey,
        { raw: null },
        { ttlMs: FEEDBACK_ISSUE_TEMPLATE_FAILURE_TTL_MS }
      );
      return null;
    }
  }

  protected parse(
    raw: string,
    source: FeedbackIssueTemplateSourceType
  ): FeedbackIssueTemplateType {
    const trimmed = raw.replace(/^\uFEFF/, '').trim();
    if (!trimmed.startsWith('---')) {
      return { title: '', labels: ['feedback'], body: trimmed, source };
    }
    const end = trimmed.indexOf('\n---', 3);
    if (end < 0) {
      return { title: '', labels: ['feedback'], body: trimmed, source };
    }
    const front = trimmed.slice(3, end).trim();
    const body = trimmed.slice(end + 4).replace(/^\r?\n/, '');
    const meta = this.parseFrontMatter(front);
    const title =
      typeof meta.title === 'string'
        ? meta.title
        : Array.isArray(meta.title)
          ? (meta.title[0] ?? '')
          : '';
    const labelsRaw = meta.labels;
    const labels = Array.isArray(labelsRaw)
      ? labelsRaw.map(String)
      : typeof labelsRaw === 'string'
        ? labelsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : ['feedback'];
    return { title, labels, body, source };
  }

  protected parseFrontMatter(front: string): FrontMatterType {
    const out: Record<string, string | string[]> = {};
    for (const line of front.split(/\r?\n/)) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key === 'labels' && value.includes(',')) {
        out[key] = value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        out[key] = value;
      }
    }
    return out;
  }
}
