import { API_PAM_TEAMS_MEMBERS_2 } from '@config/apiRoutes';
import { PamTeamsController } from '@server/controllers/PamTeamsController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

type MemberUserRouteContext = {
  params: Promise<{ teamId: string; userId: string }>;
};

export async function PATCH(req: NextRequest, context: MemberUserRouteContext) {
  const { teamId, userId } = await context.params;
  return new NextApiServer(API_PAM_TEAMS_MEMBERS_2, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).updateMember(teamId, userId, req)
    );
}

export function PUT(req: NextRequest, context: MemberUserRouteContext) {
  return PATCH(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: MemberUserRouteContext
) {
  const { teamId, userId } = await context.params;
  return new NextApiServer(API_PAM_TEAMS_MEMBERS_2, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).removeMember(teamId, userId)
    );
}
