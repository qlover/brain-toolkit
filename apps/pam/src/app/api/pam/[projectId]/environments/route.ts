import { API_PAM_ENVIRONMENTS } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

type EnvironmentsRouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * GET /api/pam/:projectId/environments — list environments (redacted).
 */
export function GET(req: NextRequest, context: EnvironmentsRouteContext) {
  return new NextApiServer(API_PAM_ENVIRONMENTS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const { projectId } = await context.params;
      return IOC(PAMController).listEnvironments(projectId);
    });
}

/**
 * POST /api/pam/:projectId/environments — create environment.
 */
export function POST(req: NextRequest, context: EnvironmentsRouteContext) {
  return new NextApiServer(API_PAM_ENVIRONMENTS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const { projectId } = await context.params;
      return IOC(PAMController).createEnvironment(projectId, req);
    });
}
