import { type NextRequest } from 'next/server';
import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_SITE_SETTINGS } from '@config/apiRoutes';
import { SiteSettingsController } from '@server/controllers/SiteSettingsController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_SITE_SETTINGS, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_site_settings_read))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(SiteSettingsController).getAdminSettings()
    );
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  return await new NextApiServer(API_ADMIN_SITE_SETTINGS, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_site_settings_write))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(SiteSettingsController).patchAdminSettings(body)
    );
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}
