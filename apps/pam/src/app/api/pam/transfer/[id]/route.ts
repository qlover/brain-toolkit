import { API_PAM_TRANSFER } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * POST /api/pam/transfer/:id — transfer project ownership (owner only).
 *
 * Body: `{ email?: string, user_id?: string }` (at least one required).
 */
export function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return new NextApiServer(API_PAM_TRANSFER, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).transferProject((await params).id, req)
    );
}
