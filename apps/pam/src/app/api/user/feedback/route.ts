import { API_USER_FEEDBACK } from '@config/apiRoutes';
import { PamUserFeedbackController } from '@server/controllers/PamUserFeedbackController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * 当前用户反馈：列表 GET / 提交 POST。
 */
export async function GET(req: NextRequest) {
  return await new NextApiServer(API_USER_FEEDBACK, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      return IOC(PamUserFeedbackController).listOwnFeedback();
    });
}

export async function POST(req: NextRequest) {
  return await new NextApiServer(API_USER_FEEDBACK, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      const userAgent = req.headers.get('user-agent');
      return IOC(PamUserFeedbackController).createFeedback(await req.json(), {
        userAgent: userAgent?.trim() ? userAgent.trim() : null
      });
    });
}
