import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_PERMISSIONS } from '@config/apiRoutes';
import { AdminPermissionsController } from '@server/controllers/AdminPermissionsController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_PERMISSIONS, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_permissions_read))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminPermissionsController).list()
    );
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  return await new NextApiServer(API_ADMIN_PERMISSIONS, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_permissions_write))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminPermissionsController).create(body)
    );
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  return await new NextApiServer(API_ADMIN_PERMISSIONS, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_permissions_write))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminPermissionsController).update(body)
    );
}
