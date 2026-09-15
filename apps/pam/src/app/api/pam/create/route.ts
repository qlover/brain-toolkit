import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_CREATE } from '@config/apiRoutes';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
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
    .use(new RequirePermissionPlugin(PermissionKey.pam_project_create))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).createProject(req)
    );
}
