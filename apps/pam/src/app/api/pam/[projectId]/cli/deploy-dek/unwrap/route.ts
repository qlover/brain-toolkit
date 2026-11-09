import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_DEPLOY_DEK_UNWRAP } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { PamCliAuthPlugin } from '@server/plugins/PamCliAuthPlugin';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type DeployDekRouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * POST /api/pam/:projectId/cli/deploy-dek/unwrap — 运行时密封回传 DEK。
 */
export async function POST(req: NextRequest, context: DeployDekRouteContext) {
  const { projectId } = await context.params;
  const response = await new NextApiServer(API_PAM_DEPLOY_DEK_UNWRAP, req)
    .use(new PamCliAuthPlugin())
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_environments_inject, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).unwrapDeployDek(projectId, req)
    );
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
