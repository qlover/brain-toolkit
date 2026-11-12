import { PermissionKey } from '@shared/auth/permissionKeys';
import { PamUserFeedbackController } from '@server/controllers/PamUserFeedbackController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

/**
 * 管理端手动为反馈创建 GitHub Issue。
 */
export async function POST(
  req: NextRequest,
  context: { readonly params: Promise<{ readonly id: string }> }
) {
  const { id } = await context.params;
  const path = `/api/admin/feedback/${id}/github-issue`;
  return await new NextApiServer(path, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_feedback_update))
    .runWithJson(async ({ parameters: { IOC } }) => {
      return IOC(PamUserFeedbackController).createAdminGithubIssue({ id });
    });
}
