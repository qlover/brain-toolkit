import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_TEAMS } from '@config/apiRoutes';
import { PamTeamsController } from '@server/controllers/PamTeamsController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return new NextApiServer(API_PAM_TEAMS, req)
    .use(new RequirePermissionPlugin(PermissionKey.pam_teams_list))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).listMine()
    );
}

export async function POST(req: NextRequest) {
  return new NextApiServer(API_PAM_TEAMS, req)
    .use(new RequirePermissionPlugin(PermissionKey.pam_teams_create))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamTeamsController).create(req)
    );
}
