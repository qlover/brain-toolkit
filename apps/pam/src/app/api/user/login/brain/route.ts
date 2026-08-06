import { API_USER_LOGIN_BRAIN } from '@config/apiRoutes';
import { UserController } from '@server/controllers/UserController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

/**
 * Start Brain OAuth authorize (PKCE) — returns { providerUrl }.
 */
export async function GET(req: NextRequest) {
  const rawQuery = Object.fromEntries(req.nextUrl.searchParams.entries());

  return await new NextApiServer(API_USER_LOGIN_BRAIN, req).runWithJson(
    async ({ parameters: { IOC } }) =>
      IOC(UserController).loginWithBrainPkce(rawQuery)
  );
}
