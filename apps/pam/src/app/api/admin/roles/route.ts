import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_ROLES } from '@config/apiRoutes';
import { AdminRolesController } from '@server/controllers/AdminRolesController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_ROLES, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_roles_read))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminRolesController).list()
    );
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  return await new NextApiServer(API_ADMIN_ROLES, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_roles_write))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminRolesController).replaceAssignments(body)
    );
}
