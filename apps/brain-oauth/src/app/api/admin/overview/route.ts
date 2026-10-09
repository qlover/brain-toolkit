import { API_ADMIN_OVERVIEW } from '@config/route';
import { AdminController } from '@server/controllers/AdminController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Admin console overview numbers
 *     description: |
 *       Read-only stats for the admin overview. Brain admins get site-wide
 *       numbers (including registered users); other signed-in users only see
 *       their own apps and request logs. Days are split by the viewer's
 *       `tzOffset` (`Date#getTimezoneOffset()`, minutes).
 *     parameters:
 *       - in: query
 *         name: tzOffset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success envelope; `data` is AdminOverview.
 *       400:
 *         description: Not authenticated or query failed.
 */
export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_OVERVIEW, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(AdminController).getOverview(req.nextUrl.searchParams)
    );
}
