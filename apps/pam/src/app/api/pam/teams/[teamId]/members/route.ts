import { API_PAM_TEAMS_MEMBERS } from '@config/apiRoutes';
import { PamTeamsController } from '@server/controllers/PamTeamsController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

type MembersRouteContext = { params: Promise<{ teamId: string }> };

export async function POST(req: NextRequest, context: MembersRouteContext) {
  const { teamId } = await context.params;
  return new NextApiServer(API_PAM_TEAMS_MEMBERS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).addMember(teamId, req)
    );
}
