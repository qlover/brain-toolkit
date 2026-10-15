import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_ENVIRONMENTS_ACCESS_LOGS } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type AccessLogsRouteContext = {
  params: Promise<{ projectId: string; envId: string }>;
};

/**
 * GET /api/pam/:projectId/environments/:envId/access-logs — recent resolve / export records.
 */
export async function GET(req: NextRequest, context: AccessLogsRouteContext) {
  const { projectId, envId } = await context.params;
  return new NextApiServer(API_PAM_ENVIRONMENTS_ACCESS_LOGS, req)
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_environments_export, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).listEnvironmentAccessLogs(projectId, envId)
    );
}
