import { API_PAM_CREATE } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 *
 * @example fetch
 * ```js
 * fetch('/api/pam/create', {
 *     method: 'POST',
 *     headers: {
 *         'Content-Type': 'application/json'
 *     },
 *     body: JSON.stringify({
 *         slug: 'test-pam2-slug',
 *         name: 'test-pam2',
 *         description: 'test-pam2-desc',
 *         stack: 'test-pam2-stack',
 *         repo_url: '',
 *         category: '前端',
 *         is_public: 0,
 *     })
 * })
 * ```
 * @param req
 * @returns
 */
export function POST(req: NextRequest) {
  return new NextApiServer(API_PAM_CREATE, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).createProject(req)
    );
}
