import { ExecutorError } from '@qlover/fe-corekit/executor';
import { type ServerContextInterface } from '@qlover/next-kit/server';
import { inject, injectable } from '@shared/container';
import type { LocaleType } from '@config/i18n';
import { API_MAIL_RECIPIENT_INVALID } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import {
  pamAdminMailTestSchema,
  pamMailTemplateSchema,
  type PamMailLogAdminItem
} from '@schemas/PamMailSchema';
import type { UserServiceInterface } from '@server/interfaces/UserServiceInterface';
import { MailService } from '@server/services/mail/MailService';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { getClientIpFromRequest } from '@server/utils/getClientIpFromRequest';
import type { NextRequest } from 'next/server';

@injectable()
export class AdminMailController {
  constructor(
    @inject(MailService) protected readonly mailService: MailService,
    @inject(OAuthUserService)
    protected readonly userService: UserServiceInterface,
    @inject(I.ServerContextInterface)
    protected readonly serverContext: ServerContextInterface
  ) {}

  public async listLogs(query: {
    limit?: string | number;
    email?: string;
    template?: string;
  }): Promise<PamMailLogAdminItem[]> {
    const limitRaw =
      typeof query.limit === 'string'
        ? Number.parseInt(query.limit, 10)
        : query.limit;
    const limit =
      typeof limitRaw === 'number' && Number.isFinite(limitRaw) ? limitRaw : 50;
    const template = pamMailTemplateSchema.safeParse(query.template);

    return this.mailService.listForAdmin({
      limit,
      email: typeof query.email === 'string' ? query.email : undefined,
      template: template.success ? template.data : undefined
    });
  }

  public async sendTest(
    body: unknown,
    request?: NextRequest
  ): Promise<{ messageId: string | null }> {
    const parsed = pamAdminMailTestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ExecutorError(API_MAIL_RECIPIENT_INVALID);
    }
    const user = await this.userService.getSessionUser();
    const locale = (await this.serverContext.getLocale()) as LocaleType;

    return this.mailService.sendTest({
      to: parsed.data.to,
      locale,
      userId: user?.id ?? null,
      clientIp: request ? getClientIpFromRequest(request) : null
    });
  }
}
