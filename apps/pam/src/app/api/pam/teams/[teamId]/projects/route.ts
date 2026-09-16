import { API_PAM_TEAMS_PROJECTS } from '@config/apiRoutes';
import { PamTeamsController } from '@server/controllers/PamTeamsController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

type ProjectsRouteContext = { params: Promise<{ teamId: string }> };

export async function GET(req: NextRequest, context: ProjectsRouteContext) {
  const { teamId } = await context.params;
  return new NextApiServer(API_PAM_TEAMS_PROJECTS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).listProjects(teamId)
    );
}

export async function POST(req: NextRequest, context: ProjectsRouteContext) {
  const { teamId } = await context.params;
  return new NextApiServer(API_PAM_TEAMS_PROJECTS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).attachProject(teamId, req)
    );
}
