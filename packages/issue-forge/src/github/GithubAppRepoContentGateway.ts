import { IssueForgeError } from '../errors/IssueForgeError';
import type {
  IssueForgeRepoContentInterface,
  IssueForgeRepoFileType,
  IssueForgeRepoFileUploadedType,
  IssueForgeRepoFileUploadInputType
} from '../interfaces/IssueForgeRepoContentInterface';
import type { GithubAppAuthConfigType } from '../types/IssueForgeTypes';
import type { GithubAppClient } from './GithubAppClient';

const ACCEPT_RAW = 'application/vnd.github.raw+json';

/**
 * GitHub App 仓库内容网关（形态 B：构造时绑定 auth/config）。
 */
export class GithubAppRepoContentGateway
  implements IssueForgeRepoContentInterface
{
  constructor(
    protected readonly client: GithubAppClient,
    protected readonly config: GithubAppAuthConfigType
  ) {}

  /**
   * @override
   */
  public async readTextFile(path: string): Promise<string | null> {
    const response = await this.client.request(
      this.config,
      this.contentsPath(path),
      { method: 'GET', accept: ACCEPT_RAW }
    );
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw await this.client.toError('read file', response);
    }
    return response.text();
  }

  /**
   * @override
   */
  public async ensureBranch(
    branch: string,
    initialFile: IssueForgeRepoFileType
  ): Promise<void> {
    const found = await this.client.request(
      this.config,
      `${this.repoPath()}/git/ref/heads/${this.encodePath(branch)}`,
      { method: 'GET' }
    );
    if (found.ok) {
      return;
    }
    if (found.status !== 404) {
      throw await this.client.toError('get branch', found);
    }

    const treeSha = await this.postForSha('create tree', '/git/trees', {
      tree: [
        {
          path: initialFile.path,
          mode: '100644',
          type: 'blob',
          content: initialFile.content
        }
      ]
    });
    const commitSha = await this.postForSha('create commit', '/git/commits', {
      message: `chore: 初始化 ${branch} 分支`,
      tree: treeSha,
      parents: []
    });
    const created = await this.client.request(
      this.config,
      `${this.repoPath()}/git/refs`,
      {
        method: 'POST',
        body: { ref: `refs/heads/${branch}`, sha: commitSha }
      }
    );
    if (!created.ok && created.status !== 422) {
      throw await this.client.toError('create branch', created);
    }
  }

  /**
   * @override
   */
  public async uploadFile(
    input: IssueForgeRepoFileUploadInputType
  ): Promise<IssueForgeRepoFileUploadedType> {
    const response = await this.client.request(
      this.config,
      this.contentsPath(input.path),
      {
        method: 'PUT',
        body: {
          message: input.message,
          content: input.contentBase64,
          branch: input.branch
        }
      }
    );
    if (response.ok) {
      const json = (await response.json()) as {
        readonly content?: { readonly html_url?: unknown };
      };
      return { url: this.requireHtmlUrl(json.content?.html_url, response) };
    }
    if (response.status === 422) {
      return this.readExisting(input);
    }
    throw await this.client.toError('upload file', response);
  }

  protected async readExisting(
    input: IssueForgeRepoFileUploadInputType
  ): Promise<IssueForgeRepoFileUploadedType> {
    const response = await this.client.request(
      this.config,
      `${this.contentsPath(input.path)}?ref=${encodeURIComponent(input.branch)}`,
      { method: 'GET' }
    );
    if (!response.ok) {
      throw await this.client.toError('upload file', response);
    }
    const json = (await response.json()) as { readonly html_url?: unknown };
    return { url: this.requireHtmlUrl(json.html_url, response) };
  }

  protected async postForSha(
    stage: string,
    path: string,
    body: unknown
  ): Promise<string> {
    const response = await this.client.request(
      this.config,
      `${this.repoPath()}${path}`,
      { method: 'POST', body }
    );
    if (!response.ok) {
      throw await this.client.toError(stage, response);
    }
    const json = (await response.json()) as { readonly sha?: unknown };
    if (typeof json.sha !== 'string' || !json.sha) {
      throw new IssueForgeError(
        `${stage}: unexpected response`,
        response.status
      );
    }
    return json.sha;
  }

  protected requireHtmlUrl(value: unknown, response: Response): string {
    if (typeof value !== 'string' || !value) {
      throw new IssueForgeError(
        'upload file: unexpected response',
        response.status
      );
    }
    return value;
  }

  protected contentsPath(path: string): string {
    return `${this.repoPath()}/contents/${this.encodePath(path)}`;
  }

  protected encodePath(path: string): string {
    return path
      .split('/')
      .filter((segment) => segment.length > 0)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  protected repoPath(): string {
    return `/repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}`;
  }
}
