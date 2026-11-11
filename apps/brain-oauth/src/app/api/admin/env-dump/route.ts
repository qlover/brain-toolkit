import { API_ADMIN_ENV_DUMP } from '@config/route';
import { EnvDumpController } from '@server/controllers/EnvDumpController';
import { NextApiServer } from '@server/NextApiServer';
import { RequireBrainAdminPlugin } from '@server/plugins/RequireBrainAdminPlugin';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * **临时急救接口** — 导出运行中进程的白名单环境变量明文，便于导入 PAM。
 *
 * 三重闸：`ENV_DUMP_ENABLED` + `x-env-dump-token` + Brain admin 会话。
 * 用完后删除本路由与相关代码，并去掉 Vercel 上的开关变量。
 *
 * @swagger
 * /api/admin/env-dump:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Temporary whitelist env dump (admin + token)
 *     parameters:
 *       - in: header
 *         name: x-env-dump-token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: dotenv text + present/missing key lists
 *       400:
 *         description: Not authorized or dump disabled
 */
export async function GET(req: NextRequest) {
  return await new NextApiServer(API_ADMIN_ENV_DUMP, req)
    .use(new ServerAuthPlugin())
    .use(new RequireBrainAdminPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(EnvDumpController).dump(req)
    );
}
