import { API_PAM_USERS_SEARCH } from '@config/route';
import { PAMController } from '@server/controllers/PAMController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerAuthPlugin } from '@server/plugins/ServerAuthPlugin';
import type { NextRequest } from 'next/server';

/**
 * GET /api/pam/users/search?q= — Auth users for transfer picker.
 */
export function GET(req: NextRequest) {
  return new NextApiServer(API_PAM_USERS_SEARCH, req)
    .use(new ServerAuthPlugin())
    .runWithJson(async ({ parameters: { IOC } }) =>
      IOC(PAMController).searchUsersForTransfer(req)
    );
}
