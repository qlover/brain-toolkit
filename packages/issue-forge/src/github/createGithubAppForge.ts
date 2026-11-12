import type { IssueForgeGatewayInterface } from '../interfaces/IssueForgeGatewayInterface';
import type { IssueForgeRepoContentInterface } from '../interfaces/IssueForgeRepoContentInterface';
import type { IssueWebhookVerifierInterface } from '../interfaces/IssueWebhookVerifierInterface';
import type {
  GithubAppAuthConfigType,
  IssueForgeTokenCacheInterface
} from '../types/IssueForgeTypes';
import { GithubAppClient } from './GithubAppClient';
import { GithubAppIssueForgeGateway } from './GithubAppIssueForgeGateway';
import { GithubAppRepoContentGateway } from './GithubAppRepoContentGateway';
import { GithubWebhookVerifier } from './GithubWebhookVerifier';

export type CreateGithubAppClientOptionsType = {
  readonly cache: IssueForgeTokenCacheInterface;
  readonly userAgent?: string;
};

/**
 * 创建可复用的 GitHub App HTTP 客户端（多仓可共用，按次传 config）。
 */
export function createGithubAppClient(
  options: CreateGithubAppClientOptionsType
): GithubAppClient {
  return new GithubAppClient(options);
}

/**
 * 绑定 config 的 Issue 网关（形态 B）。
 */
export function createGithubAppIssueForge(
  client: GithubAppClient,
  config: GithubAppAuthConfigType
): IssueForgeGatewayInterface {
  return new GithubAppIssueForgeGateway(client, config);
}

/**
 * 绑定 config 的仓库内容网关（形态 B）。
 */
export function createGithubAppRepoContent(
  client: GithubAppClient,
  config: GithubAppAuthConfigType
): IssueForgeRepoContentInterface {
  return new GithubAppRepoContentGateway(client, config);
}

/**
 * 绑定 webhook secret 的验签器（形态 B）。
 */
export function createGithubWebhookVerifier(
  secret: string
): IssueWebhookVerifierInterface {
  return new GithubWebhookVerifier(secret);
}
