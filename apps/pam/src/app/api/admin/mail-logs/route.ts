import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_MAIL_LOGS } from '@config/apiRoutes';
import { AdminMailController } from '@server/controllers/AdminMailController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_MAIL_LOGS, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_mail_logs_read))
    .runWithJson(async ({ parameters: { IOC } }) => {
      const url = new URL(req.url);
      return IOC(AdminMailController).listLogs({
        limit: url.searchParams.get('limit') ?? undefined,
        email: url.searchParams.get('email') ?? undefined,
        template: url.searchParams.get('template') ?? undefined
      });
    });
}
