import { inject, injectable } from '@shared/container';
import { API_ADMIN_MAIL_LOGS, API_ADMIN_MAIL_TEST } from '@config/route';
import type {
  PamMailLogAdminItem,
  PamMailTemplate
} from '@schemas/PamMailSchema';
import { AppApiRequester } from './AppApiRequester';
import type { NextKitApiSuccess } from '@qlover/next-kit/common';

@injectable()
export class AdminMailApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async listLogs(params?: {
    email?: string;
    template?: PamMailTemplate | '';
    limit?: number;
  }): Promise<PamMailLogAdminItem[]> {
    const response = await this.appApiRequester.get(API_ADMIN_MAIL_LOGS, {
      params: {
        email: params?.email ?? '',
        template: params?.template ?? '',
        limit: params?.limit ?? 50
      }
    });
    const envelope = response.data as NextKitApiSuccess<PamMailLogAdminItem[]>;
    return envelope.data ?? [];
  }

  public async sendTest(to: string): Promise<{ messageId: string | null }> {
    const response = await this.appApiRequester.post(API_ADMIN_MAIL_TEST, {
      to
    });
    const envelope = response.data as NextKitApiSuccess<{
      messageId: string | null;
    }>;
    return envelope.data ?? { messageId: null };
  }
}
