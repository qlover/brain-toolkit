import { API_PAM_ENVIRONMENTS_VARIABLES } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

type EnvironmentVariablesRouteContext = {
  params: Promise<{ projectId: string; envId: string }>;
};

/**
 * POST /api/pam/:projectId/environments/:envId/variables — replace variables.
 */
export function POST(
  req: NextRequest,
  context: EnvironmentVariablesRouteContext
) {
  return new NextApiServer(API_PAM_ENVIRONMENTS_VARIABLES, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const { projectId, envId } = await context.params;
      return IOC(PAMController).replaceEnvironmentVariables(
        projectId,
        envId,
        req
      );
    });
}
