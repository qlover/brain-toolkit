import { type NextRequest } from 'next/server';
import { SiteSettingsController } from '@server/controllers/SiteSettingsController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';

const API_ADMIN_SITE_SETTINGS = '/api/admin/site-settings' as const;

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_SITE_SETTINGS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(SiteSettingsController).getAdminSettings()
    );
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  return await new NextApiServer(API_ADMIN_SITE_SETTINGS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(SiteSettingsController).patchAdminSettings(body)
    );
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}
