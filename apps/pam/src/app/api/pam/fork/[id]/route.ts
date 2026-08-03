import { API_PAM_FORK } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
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
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).forkProject((await params).id, req)
    );
}
