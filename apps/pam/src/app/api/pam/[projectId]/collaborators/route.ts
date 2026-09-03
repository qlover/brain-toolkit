import { API_PAM_COLLABORATORS } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

type CollaboratorsRouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * GET /api/pam/:projectId/collaborators — list collaborators.
 */
export function GET(req: NextRequest, context: CollaboratorsRouteContext) {
  return new NextApiServer(API_PAM_COLLABORATORS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const { projectId } = await context.params;
      return IOC(PAMController).listCollaborators(projectId);
    });
}

/**
 * POST /api/pam/:projectId/collaborators — add collaborator.
 */
export function POST(req: NextRequest, context: CollaboratorsRouteContext) {
  return new NextApiServer(API_PAM_COLLABORATORS, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const { projectId } = await context.params;
      return IOC(PAMController).addCollaborator(projectId, req);
    });
}
