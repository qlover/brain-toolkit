import { permissionUid } from '@shared/auth/permissionUid';
import { API_PAM_COLLABORATORS_2 } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type CollaboratorUserRouteContext = {
  params: Promise<{ projectId: string; userId: string }>;
};

/**
 * PATCH /api/pam/:projectId/collaborators/:userId — update role.
 */
export async function PATCH(
  req: NextRequest,
  context: CollaboratorUserRouteContext
) {
  const { projectId, userId } = await context.params;
  return new NextApiServer(API_PAM_COLLABORATORS_2, req)
    .use(
      new RequirePermissionPlugin(
        permissionUid('PATCH', API_PAM_COLLABORATORS_2),
        { projectId }
      )
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).updateCollaborator(projectId, userId, req)
    );
}

/**
 * PUT /api/pam/:projectId/collaborators/:userId — update role (alias).
 */
export function PUT(req: NextRequest, context: CollaboratorUserRouteContext) {
  return PATCH(req, context);
}

/**
 * DELETE /api/pam/:projectId/collaborators/:userId — remove collaborator.
 */
export async function DELETE(
  req: NextRequest,
  context: CollaboratorUserRouteContext
) {
  const { projectId, userId } = await context.params;
  return new NextApiServer(API_PAM_COLLABORATORS_2, req)
    .use(
      new RequirePermissionPlugin(
        permissionUid('DELETE', API_PAM_COLLABORATORS_2),
        { projectId }
      )
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).removeCollaborator(projectId, userId)
    );
}
