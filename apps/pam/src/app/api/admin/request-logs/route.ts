import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_REQUEST_LOGS } from '@config/apiRoutes';
import { AdminRequestLogsController } from '@server/controllers/AdminRequestLogsController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_REQUEST_LOGS, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_request_logs_read))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminRequestLogsController).searchAll(req.nextUrl.searchParams)
    );
}
