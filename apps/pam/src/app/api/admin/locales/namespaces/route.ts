import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_LOCALES_NAMESPACES } from '@config/apiRoutes';
import { AdminLocalesController } from '@server/controllers/AdminLocalesController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_LOCALES_NAMESPACES, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_locales_read))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminLocalesController).listNamespaces()
    );
}
