import { IssueForgeError } from '../errors/IssueForgeError';
import type { IssueForgeGatewayInterface } from '../interfaces/IssueForgeGatewayInterface';
import type {
  ForgeAssetUploadedType,
  ForgeAssetUploadInputType,
  ForgeIssueCreatedType,
  ForgeIssueCreateInputType,
  ForgeIssueRefType,
  GithubAppAuthConfigType
} from '../types/IssueForgeTypes';
import type { GithubAppClient } from './GithubAppClient';
import { GithubAppRepoContentGateway } from './GithubAppRepoContentGateway';

/**
 * GitHub App Issue 网关（形态 B：构造时绑定 auth/config）。
 */
export class GithubAppIssueForgeGateway implements IssueForgeGatewayInterface {
  protected readonly assets: GithubAppRepoContentGateway;

  constructor(
    protected readonly client: GithubAppClient,
    protected readonly config: GithubAppAuthConfigType
  ) {
    this.assets = new GithubAppRepoContentGateway(client, config);
  }

  /**
   * @override
   */
  public async createIssue(
    input: ForgeIssueCreateInputType
  ): Promise<ForgeIssueCreatedType> {
    const first = await this.postIssue(input, input.labels);
    if (first.ok) {
      return this.readCreated(first);
    }
    if (first.status === 422 && input.labels.length > 0) {
      const retry = await this.postIssue(input, []);
      if (retry.ok) {
        return this.readCreated(retry);
      }
      throw await this.client.toError('create issue', retry);
    }
    throw await this.client.toError('create issue', first);
  }

  /**
   * @override
   */
  public async createComment(
    issue: ForgeIssueRefType,
    body: string
  ): Promise<void> {
    const response = await this.client.request(
      this.config,
      `${this.repoPath()}/issues/${String(issue.issueNumber)}/comments`,
      { method: 'POST', body: { body } }
    );
    if (!response.ok) {
      throw await this.client.toError('create comment', response);
    }
  }

  /**
   * @override
   */
  public async uploadAsset(
    input: ForgeAssetUploadInputType
  ): Promise<ForgeAssetUploadedType> {
    const branch = input.branch?.trim() || 'feedback-assets';
    const uploaded = await this.assets.uploadFile({
      path: input.path,
      contentBase64: input.contentBase64,
      branch,
      message: input.message?.trim() || `chore(feedback): upload ${input.path}`
    });
    return { url: `${uploaded.url}?raw=true` };
  }

  protected postIssue(
    input: ForgeIssueCreateInputType,
    labels: readonly string[]
  ): Promise<Response> {
    return this.client.request(this.config, `${this.repoPath()}/issues`, {
      method: 'POST',
      body: {
        title: input.title,
        body: input.body,
        ...(labels.length > 0 ? { labels: [...labels] } : {})
      }
    });
  }

  protected async readCreated(
    response: Response
  ): Promise<ForgeIssueCreatedType> {
    const json = (await response.json()) as {
      readonly number?: unknown;
      readonly html_url?: unknown;
      readonly node_id?: unknown;
    };
    if (typeof json.number !== 'number' || typeof json.html_url !== 'string') {
      throw new IssueForgeError(
        'create issue: unexpected response',
        response.status
      );
    }
    return {
      issueNumber: json.number,
      issueUrl: json.html_url,
      ...(typeof json.node_id === 'string'
        ? { resourceKey: json.node_id }
        : {})
    };
  }

  protected repoPath(): string {
    return `/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}`;
  }
}
