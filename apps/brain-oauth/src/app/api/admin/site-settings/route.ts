import { API_ADMIN_SITE_SETTINGS } from '@config/route';
import { SiteSettingsController } from '@server/controllers/SiteSettingsController';
import { NextApiServer } from '@server/NextApiServer';
import { RequireBrainAdminPlugin } from '@server/plugins/RequireBrainAdminPlugin';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * @swagger
 * /api/admin/site-settings:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List site settings (admin only)
 *     responses:
 *       200:
 *         description: Success envelope; `data` is AdminSiteSettingEntry[].
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update site settings (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Success envelope; `data` is the updated AdminSiteSettingEntry[].
 */
export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_SITE_SETTINGS, req)
    .use(new ServerAuthPlugin())
    .use(new RequireBrainAdminPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(SiteSettingsController).getAdminSettings()
    );
}

export async function PATCH(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_SITE_SETTINGS, req)
    .use(new ServerAuthPlugin())
    .use(new RequireBrainAdminPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(SiteSettingsController).patchAdminSettings(await req.json())
    );
}

export const PUT = PATCH;
