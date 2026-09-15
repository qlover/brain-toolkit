import { permissionUid } from '@shared/auth/permissionUid';
import { API_PAM_ENVIRONMENTS_DELETE } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type EnvironmentDeleteRouteContext = {
  params: Promise<{ projectId: string; envId: string }>;
};

/**
 * POST /api/pam/:projectId/environments/:envId/delete — delete environment.
 */
export async function POST(
  req: NextRequest,
  context: EnvironmentDeleteRouteContext
) {
  const { projectId, envId } = await context.params;
  return new NextApiServer(API_PAM_ENVIRONMENTS_DELETE, req)
    .use(
      new RequirePermissionPlugin(
        permissionUid('POST', API_PAM_ENVIRONMENTS_DELETE),
        { projectId }
      )
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).deleteEnvironment(projectId, envId)
    );
}
