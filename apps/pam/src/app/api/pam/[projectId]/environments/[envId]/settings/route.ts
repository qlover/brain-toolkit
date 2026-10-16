import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_ENVIRONMENTS_SETTINGS } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type SettingsRouteContext = {
  params: Promise<{ projectId: string; envId: string }>;
};

/**
 * POST /api/pam/:projectId/environments/:envId/settings — `{ isProtected?, url? }`.
 */
export async function POST(req: NextRequest, context: SettingsRouteContext) {
  const { projectId, envId } = await context.params;
  return new NextApiServer(API_PAM_ENVIRONMENTS_SETTINGS, req)
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_environments_export, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).updateEnvironmentSettings(projectId, envId, req)
    );
}
