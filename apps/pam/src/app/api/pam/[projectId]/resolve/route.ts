import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_RESOLVE } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { PamCliAuthPlugin } from '@server/plugins/PamCliAuthPlugin';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type ResolveByNameRouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * POST /api/pam/:projectRef/resolve — body `{ env, keys? }`.
 * Same as the env-id resolve route, addressed by project slug/id and env
 * name so `pamenv run -e` needs a single request.
 */
export async function POST(
  req: NextRequest,
  context: ResolveByNameRouteContext
) {
  const { projectId } = await context.params;
  const response = await new NextApiServer(API_PAM_RESOLVE, req)
    .use(new PamCliAuthPlugin())
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_environments_inject, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).resolveEnvironmentByName(projectId, req)
    );
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
