import { API_PAM_TEAMS } from '@config/apiRoutes';
import { PamTeamsController } from '@server/controllers/PamTeamsController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return new NextApiServer(API_PAM_TEAMS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).listMine()
    );
}

export async function POST(req: NextRequest) {
  return new NextApiServer(API_PAM_TEAMS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).create(req)
    );
}
