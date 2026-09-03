import { inject, injectable } from '@shared/container';
import type { PamPhoneOtpAdminItem } from '@schemas/PamPhoneOtpSchema';
import { PhoneOtpService } from '@server/services/PhoneOtpService';

@injectable()
export class AdminPhoneOtpsController {
  constructor(
    @inject(PhoneOtpService) protected readonly phoneOtps: PhoneOtpService
  ) {}

  public async list(query: {
    limit?: string | number;
    phone?: string;
  }): Promise<PamPhoneOtpAdminItem[]> {
    const limitRaw =
      typeof query.limit === 'string'
        ? Number.parseInt(query.limit, 10)
        : query.limit;
    const limit =
      typeof limitRaw === 'number' && Number.isFinite(limitRaw) ? limitRaw : 50;

    return this.phoneOtps.listForAdmin({
      limit,
      phone: typeof query.phone === 'string' ? query.phone : undefined
    });
  }
}
