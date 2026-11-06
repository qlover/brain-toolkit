import { ExecutorError } from '@qlover/fe-corekit/executor';
import { isEmpty } from 'lodash-es';
import { inject, injectable } from '@shared/container';
import { API_REQUEST_BODY_EMPTY } from '@config/i18n-identifier/api';
import {
  PamCiOidcBindingUpsertSchema,
  PamCiOidcProviderSchema,
  type PamCiOidcBinding,
  type PamCiOidcProviderType
} from '@schemas/PamCiOidcSchema';
import { PamCiOidcService } from '@server/services/PamCiOidcService';
import type { NextRequest } from 'next/server';

/**
 * 项目级 CI OIDC 绑定管理（GitHub / Vercel）。
 */
@injectable()
export class PamCiOidcController {
  constructor(
    @inject(PamCiOidcService)
    protected readonly ciOidcService: PamCiOidcService
  ) {}

  public async getBinding(
    projectId: string,
    request: NextRequest
  ): Promise<PamCiOidcBinding | null> {
    return this.ciOidcService.getBinding(
      projectId,
      this.parseProviderQuery(request)
    );
  }

  public async upsertBinding(
    projectId: string,
    request: NextRequest
  ): Promise<PamCiOidcBinding> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }
    if (isEmpty(body)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }
    return this.ciOidcService.upsertBinding(
      projectId,
      PamCiOidcBindingUpsertSchema.parse(body)
    );
  }

  public async deleteBinding(
    projectId: string,
    request: NextRequest
  ): Promise<{ ok: true }> {
    await this.ciOidcService.deleteBinding(
      projectId,
      this.parseProviderQuery(request)
    );
    return { ok: true };
  }

  /**
   * 前端展示用：当前站点默认 OIDC audience（按 provider）。
   */
  public async getAudienceHint(
    request: NextRequest
  ): Promise<{ audience: string }> {
    return {
      audience: await this.ciOidcService.resolveAudience(
        this.parseProviderQuery(request)
      )
    };
  }

  protected parseProviderQuery(request: NextRequest): PamCiOidcProviderType {
    const raw = request.nextUrl.searchParams.get('provider');
    if (!raw) {
      return 'github';
    }
    return PamCiOidcProviderSchema.parse(raw);
  }
}
