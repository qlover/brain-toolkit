import { permissionUid } from '@shared/auth/permissionUid';
import { API_PAM_COLLABORATORS } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type CollaboratorsRouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * GET /api/pam/:projectId/collaborators — list collaborators.
 */
export async function GET(
  req: NextRequest,
  context: CollaboratorsRouteContext
) {
  const { projectId } = await context.params;
  return new NextApiServer(API_PAM_COLLABORATORS, req)
    .use(
      new RequirePermissionPlugin(permissionUid('GET', API_PAM_COLLABORATORS), {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).listCollaborators(projectId)
    );
}

/**
 * POST /api/pam/:projectId/collaborators — add collaborator.
 */
export async function POST(
  req: NextRequest,
  context: CollaboratorsRouteContext
) {
  const { projectId } = await context.params;
  return new NextApiServer(API_PAM_COLLABORATORS, req)
    .use(
      new RequirePermissionPlugin(
        permissionUid('POST', API_PAM_COLLABORATORS),
        { projectId }
      )
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).addCollaborator(projectId, req)
    );
}
