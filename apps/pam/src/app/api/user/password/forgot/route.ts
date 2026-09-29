import { API_USER_PASSWORD_FORGOT } from '@config/apiRoutes';
import { UserController } from '@server/controllers/UserController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const requestBody = await req.json();

  return await new NextApiServer(API_USER_PASSWORD_FORGOT, req).runWithJson(
    async ({ parameters: { IOC } }) =>
      IOC(UserController).forgotPassword(requestBody, req)
  );
}
