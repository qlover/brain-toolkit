import { API_USER_DISPLAY_NAME } from '@config/route';
import { UserController } from '@server/controllers/UserController';
import { NextApiServer } from '@server/NextApiServer';
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const requestBody = await req.json();

  return await new NextApiServer(API_USER_DISPLAY_NAME, req).runWithJson(
    async ({ parameters: { IOC } }) =>
      IOC(UserController).updateDisplayName(requestBody)
  );
}
