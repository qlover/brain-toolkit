import { API_USER_PASSWORD_RESET } from '@config/apiRoutes';
import { UserController } from '@server/controllers/UserController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await new NextApiServer(API_USER_PASSWORD_RESET, req).runWithJson(
    async ({ parameters: { IOC } }) =>
      IOC(UserController).verifyResetToken(
        new URL(req.url).searchParams.get('token')
      )
  );
}

export async function POST(req: NextRequest) {
  const requestBody = await req.json();

  return await new NextApiServer(API_USER_PASSWORD_RESET, req).runWithJson(
    async ({ parameters: { IOC } }) =>
      IOC(UserController).resetPassword(requestBody, req)
  );
}
