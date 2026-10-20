import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_ENVIRONMENTS_2 } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type EnvironmentRouteContext = {
  params: Promise<{ projectId: string; envId: string }>;
};

/**
 * GET /api/pam/:projectId/environments/:envId — one env with redacted variables.
 */
export async function GET(req: NextRequest, context: EnvironmentRouteContext) {
  const { projectId, envId } = await context.params;
  const response = await new NextApiServer(API_PAM_ENVIRONMENTS_2, req)
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_environments_read, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).getEnvironment(projectId, envId)
    );
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
