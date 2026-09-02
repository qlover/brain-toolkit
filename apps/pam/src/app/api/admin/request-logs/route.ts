import { AdminRequestLogsController } from '@server/controllers/AdminRequestLogsController';
import { NextApiServer } from '@server/NextApiServer';
import { PlatformAdminPlugin } from '@server/plugins/PlatformAdminPlugin';
import type { NextRequest } from 'next/server';

const API_ADMIN_REQUEST_LOGS = '/api/admin/request-logs' as const;

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_REQUEST_LOGS, req)
    .use(new PlatformAdminPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminRequestLogsController).searchAll(req.nextUrl.searchParams)
    );
}
