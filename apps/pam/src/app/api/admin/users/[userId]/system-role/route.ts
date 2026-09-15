import { permissionUid } from '@shared/auth/permissionUid';
import { API_ADMIN_USERS_SYSTEM_ROLE } from '@config/apiRoutes';
import { AdminUsersController } from '@server/controllers/AdminUsersController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  const body = await req.json();

  return await new NextApiServer(
    API_ADMIN_USERS_SYSTEM_ROLE.replace(':userId', userId),
    req
  )
    .use(
      new RequirePermissionPlugin(
        permissionUid('PATCH', API_ADMIN_USERS_SYSTEM_ROLE)
      )
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminUsersController).setSystemRole(userId, body)
    );
}
