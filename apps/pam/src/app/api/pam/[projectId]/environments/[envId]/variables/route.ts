import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_ENVIRONMENTS_VARIABLES } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type EnvironmentVariablesRouteContext = {
  params: Promise<{ projectId: string; envId: string }>;
};

/**
 * POST /api/pam/:projectId/environments/:envId/variables — replace variables.
 */
export async function POST(
  req: NextRequest,
  context: EnvironmentVariablesRouteContext
) {
  const { projectId, envId } = await context.params;
  return new NextApiServer(API_PAM_ENVIRONMENTS_VARIABLES, req)
    .use(
      new RequirePermissionPlugin(
        PermissionKey.pam_environments_variables_write,
        { projectId }
      )
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).replaceEnvironmentVariables(projectId, envId, req)
    );
}
