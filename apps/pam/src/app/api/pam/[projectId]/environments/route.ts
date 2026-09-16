import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_ENVIRONMENTS } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type EnvironmentsRouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * GET /api/pam/:projectId/environments — list environments (redacted).
 */
export async function GET(req: NextRequest, context: EnvironmentsRouteContext) {
  const { projectId } = await context.params;
  return new NextApiServer(API_PAM_ENVIRONMENTS, req)
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_environments_read, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).listEnvironments(projectId)
    );
}

/**
 * POST /api/pam/:projectId/environments — create environment.
 */
export async function POST(
  req: NextRequest,
  context: EnvironmentsRouteContext
) {
  const { projectId } = await context.params;
  return new NextApiServer(API_PAM_ENVIRONMENTS, req)
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_environments_create, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).createEnvironment(projectId, req)
    );
}
