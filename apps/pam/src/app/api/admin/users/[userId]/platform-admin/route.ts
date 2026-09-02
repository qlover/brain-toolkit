import { AdminUsersController } from '@server/controllers/AdminUsersController';
import { NextApiServer } from '@server/NextApiServer';
import { PlatformAdminPlugin } from '@server/plugins/PlatformAdminPlugin';
import type { NextRequest } from 'next/server';

const API_ADMIN_USERS_PLATFORM_ADMIN =
  '/api/admin/users/:userId/platform-admin' as const;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  const body = await req.json();

  return await new NextApiServer(
    API_ADMIN_USERS_PLATFORM_ADMIN.replace(':userId', userId),
    req
  )
    .use(new PlatformAdminPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminUsersController).setPlatformAdmin(userId, body)
    );
}
