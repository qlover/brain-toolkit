import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_ADMIN_FEEDBACK } from '@config/apiRoutes';
import { PamUserFeedbackController } from '@server/controllers/PamUserFeedbackController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

/**
 * 管理端反馈列表。
 */
export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_FEEDBACK, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_feedback_read))
    .runWithJson(async ({ parameters: { IOC } }) => {
      return IOC(PamUserFeedbackController).listAdminFeedback();
    });
}

/**
 * 管理端修改反馈状态。
 */
export async function PATCH(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_FEEDBACK, req)
    .use(new RequirePermissionPlugin(PermissionKey.admin_feedback_update))
    .runWithJson(async ({ parameters: { IOC } }) => {
      return IOC(PamUserFeedbackController).updateAdminStatus(await req.json());
    });
}
