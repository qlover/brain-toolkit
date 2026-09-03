import { API_PAM_COLLABORATORS_2 } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

type CollaboratorUserRouteContext = {
  params: Promise<{ projectId: string; userId: string }>;
};

/**
 * PATCH /api/pam/:projectId/collaborators/:userId — update role.
 */
export function PATCH(req: NextRequest, context: CollaboratorUserRouteContext) {
  return new NextApiServer(API_PAM_COLLABORATORS_2, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const { projectId, userId } = await context.params;
      return IOC(PAMController).updateCollaborator(projectId, userId, req);
    });
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
export function DELETE(
  req: NextRequest,
  context: CollaboratorUserRouteContext
) {
  return new NextApiServer(API_PAM_COLLABORATORS_2, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const { projectId, userId } = await context.params;
      return IOC(PAMController).removeCollaborator(projectId, userId);
    });
}
