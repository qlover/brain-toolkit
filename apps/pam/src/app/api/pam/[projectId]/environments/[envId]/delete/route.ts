import { API_PAM_ENVIRONMENTS_DELETE } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

type EnvironmentDeleteRouteContext = {
  params: Promise<{ projectId: string; envId: string }>;
};

/**
 * POST /api/pam/:projectId/environments/:envId/delete — delete environment.
 */
export function POST(req: NextRequest, context: EnvironmentDeleteRouteContext) {
  return new NextApiServer(API_PAM_ENVIRONMENTS_DELETE, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const { projectId, envId } = await context.params;
      return IOC(PAMController).deleteEnvironment(projectId, envId);
    });
}
