import { PermissionKey } from '@shared/auth/permissionKeys';
import { API_PAM_FORK } from '@config/apiRoutes';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { RequirePermissionPlugin } from '@server/plugins/RequirePermissionPlugin';
import type { NextRequest } from 'next/server';

/**
 * POST /api/pam/fork/:id — fork a readable project (sensitive values stripped).
 *
 * @example
 * ```js
 * fetch('/api/pam/fork/<project-uuid>', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ slug: 'demo-fork', name: 'Demo (fork)' })
 * })
 * ```
 */
export function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return new NextApiServer(API_PAM_FORK, req)
    .use(new RequirePermissionPlugin(PermissionKey.pam_project_fork))
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).forkProject((await params).id, req)
    );
}
