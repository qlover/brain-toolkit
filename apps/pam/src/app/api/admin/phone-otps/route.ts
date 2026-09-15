import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_PHONE_OTPS } from '@config/apiRoutes';
import { AdminPhoneOtpsController } from '@server/controllers/AdminPhoneOtpsController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_PHONE_OTPS, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_phone_otps_read))
    .runWithJson(async ({ parameters: { IOC } }) => {
      const url = new URL(req.url);
      return IOC(AdminPhoneOtpsController).list({
        limit: url.searchParams.get('limit') ?? undefined,
        phone: url.searchParams.get('phone') ?? undefined
      });
    });
}
