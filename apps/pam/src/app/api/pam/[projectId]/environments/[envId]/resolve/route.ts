import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_ENVIRONMENTS_RESOLVE } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { PamCliAuthPlugin } from '@server/plugins/PamCliAuthPlugin';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type ResolveRouteContext = {
  params: Promise<{ projectId: string; envId: string }>;
};

/**
 * POST /api/pam/:projectId/environments/:envId/resolve
 * Decrypted key/values for `pamenv run` (CLI Bearer, `pam_environments_inject`).
 * POST keeps requested key names out of URLs and access logs.
 */
export async function POST(req: NextRequest, context: ResolveRouteContext) {
  const { projectId, envId } = await context.params;
  const response = await new NextApiServer(API_PAM_ENVIRONMENTS_RESOLVE, req)
    .use(new PamCliAuthPlugin())
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_environments_inject, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).resolveEnvironment(projectId, envId, req)
    );
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
