import { AdminPhoneOtpsController } from '@server/controllers/AdminPhoneOtpsController';
import { NextApiServer } from '@server/NextApiServer';
import { PlatformAdminPlugin } from '@server/plugins/PlatformAdminPlugin';
import type { NextRequest } from 'next/server';

const API_ADMIN_PHONE_OTPS = '/api/admin/phone-otps' as const;

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_PHONE_OTPS, req)
    .use(new PlatformAdminPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const url = new URL(req.url);
      return IOC(AdminPhoneOtpsController).list({
        limit: url.searchParams.get('limit') ?? undefined,
        phone: url.searchParams.get('phone') ?? undefined
      });
    });
}
