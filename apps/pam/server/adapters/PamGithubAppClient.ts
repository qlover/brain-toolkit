import {
  createGithubAppClient,
  type GithubAppClient
} from '@brain-toolkit/issue-forge';
import { MemoryKvCacheService } from '@brain-toolkit/next-app-kit/server';
import { inject, injectable } from '@shared/container';

/**
 * PAM 侧 GitHub App 客户端：注入 MemoryKv 缓存，供 Issue Forge 网关复用。
 */
@injectable()
export class PamGithubAppClient {
  public readonly client: GithubAppClient;

  constructor(
    @inject(MemoryKvCacheService)
    cache: MemoryKvCacheService
  ) {
    this.client = createGithubAppClient({
      cache,
      userAgent: 'pam-feedback'
    });
  }
}
