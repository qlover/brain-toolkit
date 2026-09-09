import { API_USER_BIND_EMAIL_SEND } from '@config/route';
import { UserController } from '@server/controllers/UserController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const requestBody = await req.json();

  return await new NextApiServer(API_USER_BIND_EMAIL_SEND, req).runWithJson(
    async ({ parameters: { IOC } }) =>
      IOC(UserController).bindEmailSend(requestBody, req)
  );
}
