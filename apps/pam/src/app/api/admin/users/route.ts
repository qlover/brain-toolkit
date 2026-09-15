import { permissionUid } from '@shared/auth/permissionUid';
import { API_ADMIN_USERS } from '@config/apiRoutes';
import { AdminUsersController } from '@server/controllers/AdminUsersController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_USERS, req)
    .use(new RequirePermissionPlugin(permissionUid('GET', API_ADMIN_USERS)))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminUsersController).search({
        q: req.nextUrl.searchParams.get('q'),
        limit: req.nextUrl.searchParams.get('limit'),
        offset: req.nextUrl.searchParams.get('offset')
      })
    );
}
