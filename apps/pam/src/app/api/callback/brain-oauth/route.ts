import { API_CALLBACK_BRAIN_OAUTH } from '@config/apiRoutes';
import { UserController } from '@server/controllers/UserController';
import { NextApiServer } from '@server/NextApiServer';

/**
 * Brain OAuth authorization-code callback (PKCE).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const rawQuery = Object.fromEntries(searchParams.entries());

  rawQuery.origin = origin;

  return await new NextApiServer(API_CALLBACK_BRAIN_OAUTH).runWithRedirect(
    async ({ parameters: { IOC } }) =>
      IOC(UserController).loginWithBrainPkceCallback(rawQuery)
  );
}
