import { AdminUsersController } from '@server/controllers/AdminUsersController';
import { NextApiServer } from '@server/NextApiServer';
import { PlatformAdminPlugin } from '@server/plugins/PlatformAdminPlugin';
import type { NextRequest } from 'next/server';

const API_ADMIN_USERS = '/api/admin/users' as const;

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_USERS, req)
    .use(new PlatformAdminPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminUsersController).search({
        q: req.nextUrl.searchParams.get('q'),
        limit: req.nextUrl.searchParams.get('limit'),
        offset: req.nextUrl.searchParams.get('offset')
      })
    );
}
