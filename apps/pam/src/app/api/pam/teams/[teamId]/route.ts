import { API_PAM_TEAMS_2 } from '@config/apiRoutes';
import { PamTeamsController } from '@server/controllers/PamTeamsController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

type TeamRouteContext = { params: Promise<{ teamId: string }> };

export async function GET(req: NextRequest, context: TeamRouteContext) {
  const { teamId } = await context.params;
  return new NextApiServer(API_PAM_TEAMS_2, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).detail(teamId)
    );
}
