import { API_PAM_CLI_LOGOUT } from '@config/route';
import { PamCliController } from '@server/controllers/PamCliController';
import { NextApiServer } from '@server/NextApiServer';
import { PamCliAuthPlugin } from '@server/plugins/PamCliAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * POST /api/pam/cli/logout — revoke current CLI bearer token (`jti`).
 */
export function POST(req: NextRequest) {
  return new NextApiServer(API_PAM_CLI_LOGOUT, req)
    .use(new PamCliAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) => {
      return IOC(PamCliController).logout(req);
    });
}
