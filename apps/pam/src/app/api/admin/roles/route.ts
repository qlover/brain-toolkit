import { permissionUid } from '@shared/auth/permissionUid';
import { API_ADMIN_ROLES } from '@config/apiRoutes';
import { AdminRolesController } from '@server/controllers/AdminRolesController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_ROLES, req)
    .use(new RequirePermissionPlugin(permissionUid('GET', API_ADMIN_ROLES)))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminRolesController).list()
    );
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  return await new NextApiServer(API_ADMIN_ROLES, req)
    .use(new RequirePermissionPlugin(permissionUid('PATCH', API_ADMIN_ROLES)))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminRolesController).replaceAssignments(body)
    );
}
