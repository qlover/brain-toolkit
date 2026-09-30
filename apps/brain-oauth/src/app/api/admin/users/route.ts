import { API_ADMIN_USERS } from '@config/route';
import { AdminController } from '@server/controllers/AdminController';
import { NextApiServer } from '@server/NextApiServer';
import { RequireBrainAdminPlugin } from '@server/plugins/RequireBrainAdminPlugin';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List local Brain users (admin only)
 *     description: |
 *       Paged, read-only list of `brain_oauth_users`. The role comes from the
 *       Brain account (synced at sign-in) and cannot be changed here.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: keyword
 *         description: Email, phone, name or user ID.
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user]
 *     responses:
 *       200:
 *         description: Success envelope; `data` is AdminUserList.
 *       400:
 *         description: Not authenticated, not an admin, or query failed.
 */
export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_USERS, req)
    .use(new ServerAuthPlugin())
    .use(new RequireBrainAdminPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminController).listUsers(req.nextUrl.searchParams)
    );
}
