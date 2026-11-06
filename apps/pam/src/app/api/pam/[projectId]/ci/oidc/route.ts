import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_CI_OIDC } from '@config/route';
import { PamCiOidcController } from '@server/controllers/PamCiOidcController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

type CiOidcRouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * GET /api/pam/:projectId/ci/oidc — 读取 GitHub OIDC 绑定。
 */
export async function GET(req: NextRequest, context: CiOidcRouteContext) {
  const { projectId } = await context.params;
  return new NextApiServer(API_PAM_CI_OIDC, req)
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_project_edit, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamCiOidcController).getBinding(projectId)
    );
}

/**
 * PUT /api/pam/:projectId/ci/oidc — upsert GitHub owner/repo 绑定。
 */
export async function PUT(req: NextRequest, context: CiOidcRouteContext) {
  const { projectId } = await context.params;
  return new NextApiServer(API_PAM_CI_OIDC, req)
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_project_edit, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamCiOidcController).upsertBinding(projectId, req)
    );
}

/**
 * DELETE /api/pam/:projectId/ci/oidc — 删除绑定。
 */
export async function DELETE(req: NextRequest, context: CiOidcRouteContext) {
  const { projectId } = await context.params;
  return new NextApiServer(API_PAM_CI_OIDC, req)
    .use(
      new RequirePermissionPlugin(PermissionKey.pam_project_edit, {
        projectId
      })
    )
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PamCiOidcController).deleteBinding(projectId)
    );
}
