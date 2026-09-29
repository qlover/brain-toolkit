import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_MAIL_TEST } from '@config/apiRoutes';
import { AdminMailController } from '@server/controllers/AdminMailController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  return await new NextApiServer(API_ADMIN_MAIL_TEST, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_mail_test))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminMailController).sendTest(body, req)
    );
}
